const ActiveGame = require('../models/ActiveGame');
const Guild = require('../models/Guild');
const Player = require('../models/Player');
const stats = require('../utils/stats');
const dictionary = require('../utils/dictionary');
const { PermissionsBitField } = require('discord.js');
const { setChannel } = require('../utils/channel');
const EventEngine = require('./EventEngine');

const START_COMMAND = '!start';
const STOP_COMMAND = '!stop';
const PREFIX = '?phobo';

const handleMessage = async (message, client) => {
    if (message.author.bot) return;

    let guild = message.guild;
    let channel = message.channel;

    if (message.content.startsWith(PREFIX)) {
        let arg = message.content.trim().split(/\s+/).filter(Boolean)[1];
        if (arg === 'set') {
            if (!message.member.permissionsIn(channel).has(PermissionsBitField.Flags.ManageGuild)) {
                return message.reply({ content: 'Bạn cần có quyền `MANAGE_GUILD` để dùng lệnh này', ephemeral: true });
            } else {
                await setChannel(guild.id, channel.id);
                return message.reply({ content: `Bạn đã chọn kênh **${channel.name}** làm kênh nối từ của máy chủ **${guild.name}**. Dùng \`!start\` để bắt đầu trò chơi`, ephemeral: true });
            }
        }
    }

    const guildConfig = await Guild.findOne({ guildId: guild.id });
    if (!guildConfig || !guildConfig.channelId) return;

    const configChannel = guildConfig.channelId;
    if (channel.id !== configChannel) return;

    let activeGame = await ActiveGame.findOne({ channelId: configChannel });
    if (!activeGame) {
        activeGame = await ActiveGame.create({ channelId: configChannel, running: false, words: [] });
    }

    if (message.content === START_COMMAND) {
        if (!activeGame.running) {
            await startGame(configChannel, client);
        } else {
            sendMessageToChannel('Trò chơi vẫn đang tiếp tục. Bạn có thể dùng `!stop`', configChannel, client);
        }
        return;
    } else if (message.content === STOP_COMMAND) {
        if (!message.member.permissionsIn(channel).has(PermissionsBitField.Flags.ManageChannels)) {
            return message.reply({ content: 'Bạn không có quyền dùng lệnh này', ephemeral: true });
        }
        if (activeGame.running) {
            if (activeGame.words.length > (guildConfig.recordChain || 0)) {
                guildConfig.recordChain = activeGame.words.length;
                guildConfig.recordHolders = message.author.displayName || "Admin";
                await guildConfig.save();
                sendMessageToChannel(`🏆 **KỶ LỤC MỚI!** Chuỗi nối từ vừa bị dừng lại ở con số **${activeGame.words.length}** từ!`, configChannel, client);
            } else {
                sendMessageToChannel(`Đã kết thúc lượt này! Lượt mới đã bắt đầu!`, configChannel, client);
            }
            await stats.addRoundPlayedCount();
            await ActiveGame.updateOne({ channelId: configChannel }, { running: false, words: [], 'currentPlayer.id': null, currentEvent: null, eventEndsAt: 0 });
            await startGame(configChannel, client);
        } else {
            sendMessageToChannel('Trò chơi chưa bắt đầu. Bạn có thể dùng `!start`', configChannel, client);
        }
        return;
    }

    if (!activeGame.running) return;

    let tu = message.content.trim().toLowerCase();
    let args1 = tu.split(/\s+/).filter(Boolean);
    tu = args1.join(' '); 
    let words = activeGame.words;

    let player = await Player.findOne({ guildId: guild.id, userId: message.author.id });
    if (!player) {
        player = await Player.create({ guildId: guild.id, userId: message.author.id, name: message.author.displayName, avatar: message.author.avatarURL() });
    } else {
        player.name = message.author.displayName;
        player.avatar = message.author.avatarURL();
        await player.save();
    }

    if (args1.length !== 2) return;

    if (words.length > 0) {
        if (message.author.id === activeGame.currentPlayer.id) {
            message.react('❌');
            sendAutoDeleteMessageToChannel('Bạn đã trả lời lượt trước rồi, hãy đợi đối thủ!', configChannel, client);
            return;
        }
        
        const lastWord = words[words.length - 1];
        const args2 = lastWord.split(/\s+/).filter(Boolean);
        
        let isValid = false;
        let expected = '';
        const lastLetterMode = activeGame.currentEvent && activeGame.currentEvent.startsWith('LAST_LETTER');

        if (lastLetterMode) {
            expected = lastWord.slice(-1);
            isValid = tu.startsWith(expected);
        } else {
            expected = args2[args2.length - 1];
            isValid = args1[0] === expected;
        }

        if (!isValid) {
            message.react('❌');
            const errMsg = lastLetterMode ? `Luật Lật Kèo! Hãy nối từ bắt đầu bằng CHỮ CÁI: \`${expected}\`` : `Từ này không bắt đầu với tiếng \`${expected}\``;
            sendAutoDeleteMessageToChannel(errMsg, configChannel, client);
            return;
        }
    }

    const eventCheck = EventEngine.checkEventRules(tu, activeGame);
    if (!eventCheck.valid) {
        message.react('❌');
        sendAutoDeleteMessageToChannel(eventCheck.message, configChannel, client);
        return;
    }

    if (words.includes(tu)) {
        message.react('❌');
        sendAutoDeleteMessageToChannel('Từ này đã được sử dụng!', configChannel, client);
        return;
    }

    const blackListWords = dictionary.getReportWords();
    let validDic = global.dicData.filter(item => !blackListWords.includes(item));
    
    if (!validDic.includes(tu)) {
        message.react('❌');
        player.total += 1;
        await player.save();
        return;
    }

    words.push(tu);
    activeGame.words = words;
    activeGame.currentPlayer = { id: message.author.id, name: message.author.displayName };

    // Handle Event Turn countdown
    if (activeGame.currentEvent) {
        if (words.length >= activeGame.eventEndsAt) {
            activeGame.currentEvent = null;
            activeGame.eventEndsAt = 0;
            sendMessageToChannel(`🌤️ Sự kiện đã kết thúc! Luật chơi trở lại bình thường.`, configChannel, client);
        }
    } else {
        // Try trigger new event
        const newEvent = EventEngine.triggerRandomEvent(activeGame, configChannel, client);
        if (newEvent) {
            activeGame.currentEvent = newEvent;
            activeGame.eventEndsAt = words.length + 3; // Lasts 3 turns
        }
    }

    await activeGame.save();

    message.react('✅');
    await stats.addWordPlayedCount();
    
    const bonus = EventEngine.getBonusMultiplier(tu, activeGame);
    if (bonus > 1) {
        sendAutoDeleteMessageToChannel(`🎉 <@${message.author.id}> đã nhận được **x${bonus} Điểm** từ sự kiện Kho Báu!`, configChannel, client, 5);
    }
    
    player.true += bonus;
    player.total += 1;
    await player.save();

    console.log(`[${guild.name}][${channel.name}][#${words.length}] ${tu}`);

    if (!checkIfHaveAnswerInDb(tu, words, validDic, activeGame.currentEvent)) {
        if (words.length > (guildConfig.recordChain || 0)) {
            guildConfig.recordChain = words.length;
            guildConfig.recordHolders = message.author.displayName;
            await guildConfig.save();
            sendMessageToChannel(`🏆 **KỶ LỤC SERVER MỚI!** Không ai có thể nối tiếp được nữa.\nChuỗi nối từ xuất sắc đạt mốc **${words.length}** từ! (Người chốt hạ: **${message.author.displayName}**)\n\n🔄 Lượt mới đã tự động bắt đầu!`, configChannel, client);
        } else {
            sendMessageToChannel(`${message.author.displayName} đã chiến thắng sau ${words.length - 1} lượt! Lượt mới đã bắt đầu!`, configChannel, client);
        }
        player.win += 1;
        await player.save();
        await stats.addRoundPlayedCount();
        await ActiveGame.updateOne({ channelId: configChannel }, { running: false, words: [], 'currentPlayer.id': null, currentEvent: null, eventEndsAt: 0 });
        await startGame(configChannel, client);
    }
};

const startGame = async (channelId, client) => {
    let word = randomWord();
    await ActiveGame.updateOne({ channelId }, { running: true, words: [word], 'currentPlayer.id': null, currentEvent: null, eventEndsAt: 0 });
    sendMessageToChannel(`Từ bắt đầu: **${word}**`, channelId, client);
};

const randomWord = () => {
    const wordIndex = Math.floor(Math.random() * (global.dicData.length - 1));
    const rWord = global.dicData[wordIndex];
    let queryCount = wordIndex + 1;
    
    const result = checkIfHaveAnswer(rWord, global.dicData);
    stats.addQuery(queryCount + result.queries); 
    
    return result.hasAnswer ? rWord : randomWord();
};

const checkIfHaveAnswer = (word, validDic) => {
    let w = word.split(/ +/);
    let lc = w[w.length - 1];
    let queries = 0;
    
    for (let i = 0; i < validDic.length; i++) {
        queries++;
        let temp = validDic[i];
        let tempw = temp.split(/ +/);
        if (tempw.length > 1 && tempw[0] === lc && temp !== word) {
            return { hasAnswer: true, queries };
        }
    }
    return { hasAnswer: false, queries };
};

const checkIfHaveAnswerInDb = (word, usedWords, validDic, currentEvent) => {
    let w = word.split(/ +/);
    let expected = w[w.length - 1];
    
    // Nếu đang trong event Last Letter
    if (currentEvent && currentEvent.startsWith('LAST_LETTER')) {
        expected = word.slice(-1);
    }

    let queries = 0;
    
    for (let i = 0; i < validDic.length; i++) {
        queries++;
        let temp = validDic[i];
        
        let isValid = false;
        if (currentEvent && currentEvent.startsWith('LAST_LETTER')) {
            isValid = temp.startsWith(expected);
        } else {
            let tempw = temp.split(/ +/);
            isValid = tempw.length > 1 && tempw[0] === expected;
        }

        if (isValid && temp !== word) {
            if (usedWords.includes(temp)) continue;
            // Kiểm tra luôn luật cấm chữ nếu có event
            if (currentEvent && currentEvent.startsWith('BAN_LETTER')) {
                const bannedChar = currentEvent.split(':')[1];
                const normalized = temp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                if (normalized.includes(bannedChar)) continue;
            }
            stats.addQuery(queries);
            return true;
        }
    }
    stats.addQuery(queries);
    return false;
};

const sendMessageToChannel = (msg, channel_id, client) => {
    const channel = client.channels.cache.get(channel_id);
    if(channel) {
        channel.send({ content: msg, flags: [4096] });
    }
};

const sendAutoDeleteMessageToChannel = (msg, channel_id, client, seconds = 3) => {
    const channel = client.channels.cache.get(channel_id);
    if(channel) {
        channel.send({ content: msg, flags: [4096] }).then(mess => setTimeout(() => mess.delete().catch(()=>{}), 1000 * seconds));
    }
};

module.exports = {
    handleMessage
};
