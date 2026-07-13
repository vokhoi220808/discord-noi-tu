const SoloMatch = require('../models/SoloMatch');
const Player = require('../models/Player');
const { EmbedBuilder } = require('discord.js');

global.soloTimers = {};

const startTurnTimer = (channelId, userId, timeLimit, client) => {
    if (global.soloTimers[channelId]) {
        clearTimeout(global.soloTimers[channelId]);
    }

    if (timeLimit <= 0) return; // Infinite time

    global.soloTimers[channelId] = setTimeout(async () => {
        try {
            const match = await SoloMatch.findOne({ channelId });
            if (!match) return;
            if (match.status !== 'playing') return;
            if (match.turn !== userId) return;

            // Kiểm tra bùa miễn tử
            const player = await Player.findOne({ guildId: match.guildId, userId: userId });
            if (player && player.items && player.items.bua_mien_tu > 0) {
                // Tiêu thụ bùa
                player.items.bua_mien_tu -= 1;
                player.markModified('items');
                await player.save();

                const channel = client.channels.cache.get(channelId);
                if (channel) {
                    const embed = new EmbedBuilder()
                        .setColor('#10B981')
                        .setTitle('🛡️ BÙA MIỄN TỬ ĐÃ KÍCH HOẠT!')
                        .setDescription(`<@${userId}> đã hết giờ nhưng được cứu sống bởi **Bùa Miễn Tử**!\nLượt được bỏ qua và chuyển sang cho đối thủ.`);
                    channel.send({ embeds: [embed] });
                }

                // Chuyển lượt lại cho đối thủ
                const nextTurn = match.player1 === userId ? match.player2 : match.player1;

                if (!nextTurn) {
                    // Bot turn
                    const lastWord = match.words[match.words.length - 1];
                    const botWord = getBotAnswer(lastWord, match.words, match.language === 'en' ? global.enDicData : global.dicData, match.language);
                    match.words.push(botWord);
                    await SoloMatch.updateOne({ channelId }, { words: match.words, turn: match.player1 });
                    if (channel) channel.send(`🤖 **Bot:** ${botWord}`);
                    startTurnTimer(channelId, match.player1, match.timeLimit, client);
                } else {
                    // Player turn
                    await SoloMatch.updateOne({ channelId }, { turn: nextTurn });
                    startTurnTimer(channelId, nextTurn, match.timeLimit, client);
                }

                return;
            }

            const winnerId = match.player1 === userId ? match.player2 : match.player1;
            
            await processPvpResult(match.guildId, winnerId, userId, match.player2 === null, match.language);
            await SoloMatch.deleteOne({ channelId });

            const channel = client.channels.cache.get(channelId);
            if (channel) {
                const embed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏱️ HẾT GIỜ!')
                    .setDescription(`<@${userId}> đã không đưa ra câu trả lời trong thời gian quy định (${match.timeLimit}s)!\n\n🏆 **Người chiến thắng:** ${winnerId ? `<@${winnerId}>` : '**Độ Mixi**'}`);
                channel.send({ embeds: [embed] });
            }
        } catch (e) {
            console.error('Timer error:', e);
        }
    }, timeLimit * 1000);
};

const processPvpResult = async (guildId, winnerId, loserId, isPve = false, language = 'vi') => {
    if (isPve) return; // Do not update stats for Bot matches
    if (winnerId) {
        const pWin = await Player.findOne({ guildId, userId: winnerId });
        if (pWin) {
            const isX2 = pWin.expMultiplierUntil && new Date(pWin.expMultiplierUntil) > new Date();
            if (isX2) pWin.bonusExp = (pWin.bonusExp || 0) + 15;

            if (language === 'en') {
                pWin.enPvpWin = (pWin.enPvpWin || 0) + 1;
                pWin.enPvpWinStreak = (pWin.enPvpWinStreak || 0) + 1;
            } else {
                pWin.pvpWin = (pWin.pvpWin || 0) + 1;
                pWin.pvpWinStreak = (pWin.pvpWinStreak || 0) + 1;
            }
            pWin.coins = (pWin.coins || 0) + 20;
            await pWin.save();
        }
    }
    if (loserId) {
        if (language === 'en') {
            await Player.updateOne({ guildId, userId: loserId }, { $inc: { enPvpLoss: 1 }, $set: { enPvpWinStreak: 0 } }, { upsert: true });
        } else {
            await Player.updateOne({ guildId, userId: loserId }, { $inc: { pvpLoss: 1 }, $set: { pvpWinStreak: 0 } }, { upsert: true });
        }
    }
};

const handleMessage = async (message, match, client) => {
    if (message.author.id !== match.turn) {
        if (message.author.id === match.player1 || message.author.id === match.player2) {
            const reply = await message.reply('⏳ Bình tĩnh nào, chưa tới lượt của bạn!');
            setTimeout(() => {
                message.delete().catch(() => {});
                reply.delete().catch(() => {});
            }, 3000);
        }
        return;
    }

    const language = match.language || 'vi';
    const content = message.content.trim().toLowerCase();
    const args1 = content.split(/\s+/).filter(Boolean);

    if (language === 'vi' && args1.length !== 2) {
        message.react('❌');
        return;
    }
    if (language === 'en' && args1.length !== 1) {
        message.react('❌');
        return;
    }

    let tu = language === 'en' ? args1[0] : content;

    // Rule 2: Must match
    if (match.words.length > 0) {
        const lastWord = match.words[match.words.length - 1];
        let expected = '';
        let isValid = false;

        if (language === 'en') {
            expected = lastWord.slice(-1);
            isValid = tu.startsWith(expected);
        } else {
            const args2 = lastWord.split(/\s+/).filter(Boolean);
            expected = args2[args2.length - 1];
            isValid = args1[0] === expected;
        }

        if (!isValid) {
            message.react('❌');
            return;
        }
    }

    // Rule 3: Must not be used before
    if (match.words.includes(tu)) {
        message.react('❌');
        return;
    }

    // Rule 4: Must exist in dictionary
    let currentDicData = language === 'en' ? global.enDicData : global.dicData;
    if (!currentDicData.includes(tu)) {
        message.react('❌');
        return;
    }

    // Valid word!
    if (global.soloTimers[match.channelId]) {
        clearTimeout(global.soloTimers[match.channelId]);
    }

    message.react('✅');
    match.words.push(tu);

    // Check if opponent can reply (win condition)
    const result = checkIfHaveAnswer(tu, match.words, currentDicData, language);

    if (!result.hasAnswer) {
        // Current player wins
        const loserId = match.player1 === match.turn ? match.player2 : match.player1;
        await processPvpResult(match.guildId, match.turn, loserId, match.player2 === null, language);
        await SoloMatch.deleteOne({ channelId: match.channelId });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 CHIẾN THẮNG TUYỆT ĐỐI!')
            .setDescription(`<@${match.turn}> đã tung ra từ **"${tu}"** - một từ không có lối thoát!\n\nChúc mừng <@${match.turn}> đã giành chiến thắng! 🎉`);
        return message.channel.send({ embeds: [embed] });
    }

    // Switch turn
    const nextTurn = match.player1 === match.turn ? match.player2 : match.player1;

    if (!nextTurn) {
        // PvE: Bot's turn
        const botWord = getBotAnswer(tu, match.words, currentDicData, language);
        match.words.push(botWord);
        
        // Check if player can reply to bot
        const playerResult = checkIfHaveAnswer(botWord, match.words, currentDicData, language);
        if (!playerResult.hasAnswer) {
            // Bot wins
            await processPvpResult(match.guildId, null, match.turn, true, language);
            await SoloMatch.deleteOne({ channelId: match.channelId });
            
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🤖 BOT CHIẾN THẮNG!')
                .setDescription(`Độ Mixi đã đáp trả bằng từ **"${botWord}"** - Bạn đã bị dồn vào đường cùng!\n\nThất bại là mẹ thành công, hãy thử lại nhé!`);
            return message.channel.send({ embeds: [embed] });
        }

        // Return turn to player
        await SoloMatch.updateOne({ channelId: match.channelId }, { words: match.words, turn: match.player1 });
        message.channel.send(`🤖 **Bot:** ${botWord}`);
        startTurnTimer(match.channelId, match.player1, match.timeLimit, client);
    } else {
        // PvP: Opponent's turn
        await SoloMatch.updateOne({ channelId: match.channelId }, { words: match.words, turn: nextTurn });
        startTurnTimer(match.channelId, nextTurn, match.timeLimit, client);
    }
};

const checkIfHaveAnswer = (word, usedWords, validDic, language) => {
    let expected = '';
    if (language === 'en') {
        expected = word.slice(-1);
    } else {
        let w = word.split(/ +/);
        expected = w[w.length - 1];
    }
    
    for (let i = 0; i < validDic.length; i++) {
        let temp = validDic[i];
        
        if (language === 'en') {
            if (temp.startsWith(expected) && temp !== word && !usedWords.includes(temp)) {
                return { hasAnswer: true, word: temp };
            }
        } else {
            let tempw = temp.split(/ +/);
            if (tempw.length > 1 && tempw[0] === expected && temp !== word && !usedWords.includes(temp)) {
                return { hasAnswer: true, word: temp };
            }
        }
    }
    return { hasAnswer: false };
};

const getBotAnswer = (word, usedWords, validDic, language) => {
    let expected = '';
    if (language === 'en') {
        expected = word.slice(-1);
    } else {
        let w = word.split(/ +/);
        expected = w[w.length - 1];
    }
    let possibleAnswers = [];
    
    for (let i = 0; i < validDic.length; i++) {
        let temp = validDic[i];
        
        if (language === 'en') {
            if (temp.startsWith(expected) && temp !== word && !usedWords.includes(temp)) {
                possibleAnswers.push(temp);
            }
        } else {
            let tempw = temp.split(/ +/);
            if (tempw.length > 1 && tempw[0] === expected && temp !== word && !usedWords.includes(temp)) {
                possibleAnswers.push(temp);
            }
        }
    }
    
    // Pick a random answer
    return possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
};

module.exports = {
    startTurnTimer,
    handleMessage,
    processPvpResult
};
