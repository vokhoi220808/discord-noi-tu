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
                await setChannel(guild.id, channel.id, 'vi');
                return message.reply({ content: `Bạn đã chọn kênh **${channel.name}** làm kênh nối từ (VI). Dùng \`!start\` để bắt đầu`, ephemeral: true });
            }
        }
    }

    const guildConfig = await Guild.findOne({ guildId: guild.id });
    if (!guildConfig || !guildConfig.channels || guildConfig.channels.length === 0) return;

    const channelConfig = guildConfig.channels.find(c => c.channelId === channel.id);
    if (!channelConfig) return;

    const configChannel = channel.id;
    const language = channelConfig.language || 'vi';

    let activeGame = await ActiveGame.findOne({ channelId: configChannel });
    if (!activeGame) {
        activeGame = await ActiveGame.create({ channelId: configChannel, language: language, running: false, words: [] });
    }

    if (message.content === START_COMMAND) {
        if (!activeGame.running) {
            await startGame(configChannel, language, client);
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
            await startGame(configChannel, language, client);
        } else {
            sendMessageToChannel('Trò chơi chưa bắt đầu. Bạn có thể dùng `!start`', configChannel, client);
        }
        return;
    }

    if (!activeGame.running) return;

    let tu = message.content.trim().toLowerCase();
    let args1 = tu.split(/\s+/).filter(Boolean);
    if (language === 'vi') {
        tu = args1.join(' '); 
    } else {
        tu = args1[0] || ''; 
    }
    let words = activeGame.words;

    let player = await Player.findOne({ guildId: guild.id, userId: message.author.id });
    if (!player) {
        player = await Player.create({ guildId: guild.id, userId: message.author.id, name: message.author.displayName, avatar: message.author.avatarURL() });
    } else {
        player.name = message.author.displayName;
        player.avatar = message.author.avatarURL();
        await player.save();
    }

    if (language === 'vi' && args1.length !== 2) return;
    if (language === 'en' && args1.length !== 1) return;

    if (words.length > 0) {
        if (message.author.id === activeGame.currentPlayer.id) {
            message.react('❌');
            sendAutoDeleteMessageToChannel('Bạn đã trả lời lượt trước rồi, hãy đợi đối thủ!', configChannel, client);
            return;
        }
        
        const lastWord = words[words.length - 1];
        let isValid = false;
        let expected = '';
        const lastLetterMode = activeGame.currentEvent && activeGame.currentEvent.startsWith('LAST_LETTER');

        if (language === 'en' || lastLetterMode) {
            expected = lastWord.slice(-1);
            isValid = tu.startsWith(expected);
        } else {
            const args2 = lastWord.split(/\s+/).filter(Boolean);
            expected = args2[args2.length - 1];
            isValid = args1[0] === expected;
        }

        if (!isValid) {
            message.react('❌');
            const errMsg = language === 'en' 
                ? `The word must start with the letter \`${expected}\``
                : (lastLetterMode ? `Luật Lật Kèo! Hãy nối từ bắt đầu bằng CHỮ CÁI: \`${expected}\`` : `Từ này không bắt đầu với tiếng \`${expected}\``);
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
        sendAutoDeleteMessageToChannel(language === 'en' ? 'This word has already been used!' : 'Từ này đã được sử dụng!', configChannel, client);
        return;
    }

    let currentDicData = language === 'en' ? global.enDicData : global.dicData;
    const blackListWords = dictionary.getReportWords();
    let validDic = language === 'vi' ? currentDicData.filter(item => !blackListWords.includes(item)) : currentDicData;
    
    if (!validDic.includes(tu)) {
        message.react('❌');
        if (language === 'en') player.enTotal += 1;
        else player.total += 1;
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
    
    // Check x2 EXP buff
    const isX2 = player.expMultiplierUntil && new Date(player.expMultiplierUntil) > new Date();
    if (isX2) {
        player.bonusExp = (player.bonusExp || 0) + bonus;
    }

    if (language === 'en') {
        player.enTrue += bonus;
        player.enTotal += 1;
        player.coins = (player.coins || 0) + bonus;
    } else {
        player.true += bonus;
        player.total += 1;
        player.coins = (player.coins || 0) + bonus;
    }
    await player.save();

    console.log(`[${guild.name}][${channel.name}][#${words.length}] ${tu}`);

    if (!checkIfHaveAnswerInDb(tu, words, validDic, activeGame.currentEvent, language)) {
        if (words.length > (guildConfig.recordChain || 0)) {
            guildConfig.recordChain = words.length;
            guildConfig.recordHolders = message.author.displayName;
            await guildConfig.save();
            sendMessageToChannel(`🏆 **KỶ LỤC SERVER MỚI!** Không ai có thể nối tiếp được nữa.\nChuỗi nối từ xuất sắc đạt mốc **${words.length}** từ! (Người chốt hạ: **${message.author.displayName}**)\n\n🔄 Lượt mới đã tự động bắt đầu!`, configChannel, client);
        } else {
            sendMessageToChannel(`${message.author.displayName} đã chiến thắng sau ${words.length - 1} lượt! Lượt mới đã bắt đầu!`, configChannel, client);
        }
        if (language === 'en') player.enWin += 1;
        else player.win += 1;
        player.coins = (player.coins || 0) + 10;
        await player.save();
        await stats.addRoundPlayedCount();
        await ActiveGame.updateOne({ channelId: configChannel }, { running: false, words: [], 'currentPlayer.id': null, currentEvent: null, eventEndsAt: 0 });
        await startGame(configChannel, language, client);
    }
};

const startGame = async (channelId, language, client) => {
    let word = randomWord(language);
    await ActiveGame.updateOne({ channelId }, { language: language, running: true, words: [word], 'currentPlayer.id': null, currentEvent: null, eventEndsAt: 0 });
    const langStr = language === 'en' ? 'Tiếng Anh' : 'Tiếng Việt';
    sendMessageToChannel(`Từ bắt đầu (${langStr}): **${word}**`, channelId, client);
};

const randomWord = (language) => {
    let currentDicData = language === 'en' ? global.enDicData : global.dicData;
    const wordIndex = Math.floor(Math.random() * (currentDicData.length - 1));
    const rWord = currentDicData[wordIndex];
    let queryCount = wordIndex + 1;
    
    const result = checkIfHaveAnswer(rWord, currentDicData, language);
    stats.addQuery(queryCount + result.queries); 
    
    return result.hasAnswer ? rWord : randomWord(language);
};

const checkIfHaveAnswer = (word, validDic, language) => {
    let expected = '';
    if (language === 'en') {
        expected = word.slice(-1);
    } else {
        let w = word.split(/ +/);
        expected = w[w.length - 1];
    }
    
    let queries = 0;
    
    for (let i = 0; i < validDic.length; i++) {
        queries++;
        let temp = validDic[i];
        if (language === 'en') {
            if (temp.startsWith(expected) && temp !== word) return { hasAnswer: true, queries };
        } else {
            let tempw = temp.split(/ +/);
            if (tempw.length > 1 && tempw[0] === expected && temp !== word) {
                return { hasAnswer: true, queries };
            }
        }
    }
    return { hasAnswer: false, queries };
};

const checkIfHaveAnswerInDb = (word, usedWords, validDic, currentEvent, language) => {
    let expected = '';
    if (language === 'en' || (currentEvent && currentEvent.startsWith('LAST_LETTER'))) {
        expected = word.slice(-1);
    } else {
        let w = word.split(/ +/);
        expected = w[w.length - 1];
    }

    let queries = 0;
    
    for (let i = 0; i < validDic.length; i++) {
        queries++;
        let temp = validDic[i];
        
        let isValid = false;
        if (language === 'en' || (currentEvent && currentEvent.startsWith('LAST_LETTER'))) {
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
