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
        console.log(`[DEBUG] Timeout triggered for channel: ${channelId}, user: ${userId}`);
        try {
            const match = await SoloMatch.findOne({ channelId });
            if (!match) {
                console.log(`[DEBUG] Match not found for channel ${channelId}`);
                return;
            }
            if (match.status !== 'playing') {
                console.log(`[DEBUG] Match status is not playing: ${match.status}`);
                return;
            }
            if (match.turn !== userId) {
                console.log(`[DEBUG] Turn mismatch. Expected: ${userId}, Actual: ${match.turn}`);
                return;
            }

            console.log(`[DEBUG] Timeout valid. Processing loss for user ${userId}`);
            const winnerId = match.player1 === userId ? match.player2 : match.player1;
            
            await processPvpResult(match.guildId, winnerId, userId, match.player2 === null);
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

const processPvpResult = async (guildId, winnerId, loserId, isPve = false) => {
    if (isPve) return; // Do not update stats for Bot matches
    if (winnerId) {
        await Player.updateOne({ guildId, userId: winnerId }, { $inc: { pvpWin: 1, pvpWinStreak: 1 } }, { upsert: true });
    }
    if (loserId) {
        await Player.updateOne({ guildId, userId: loserId }, { $inc: { pvpLoss: 1 }, $set: { pvpWinStreak: 0 } }, { upsert: true });
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

    const content = message.content.trim().toLowerCase();
    const args1 = content.split(/\s+/).filter(Boolean);

    // Rule 1: Must be exactly 2 words
    if (args1.length !== 2) {
        message.react('❌');
        return;
    }

    // Rule 2: Must match last word's last character
    if (match.words.length > 0) {
        const lastWord = match.words[match.words.length - 1];
        const args2 = lastWord.split(/\s+/).filter(Boolean);
        if (args1[0] !== args2[args2.length - 1]) {
            message.react('❌');
            return;
        }
    }

    // Rule 3: Must not be used before
    if (match.words.includes(content)) {
        message.react('❌');
        return;
    }

    // Rule 4: Must exist in dictionary
    if (!global.dicData.includes(content)) {
        message.react('❌');
        return;
    }

    // Valid word!
    if (global.soloTimers[match.channelId]) {
        clearTimeout(global.soloTimers[match.channelId]);
    }

    message.react('✅');
    match.words.push(content);

    // Check if opponent can reply (win condition)
    const result = checkIfHaveAnswer(content, match.words, global.dicData);

    if (!result.hasAnswer) {
        // Current player wins
        const loserId = match.player1 === match.turn ? match.player2 : match.player1;
        await processPvpResult(match.guildId, match.turn, loserId, match.player2 === null);
        await SoloMatch.deleteOne({ channelId: match.channelId });

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 CHIẾN THẮNG TUYỆT ĐỐI!')
            .setDescription(`<@${match.turn}> đã tung ra từ **"${content}"** - một từ không có lối thoát!\n\nChúc mừng <@${match.turn}> đã giành chiến thắng! 🎉`);
        return message.channel.send({ embeds: [embed] });
    }

    // Switch turn
    const nextTurn = match.player1 === match.turn ? match.player2 : match.player1;

    if (!nextTurn) {
        // PvE: Bot's turn
        const botWord = getBotAnswer(content, match.words, global.dicData);
        match.words.push(botWord);
        
        // Check if player can reply to bot
        const playerResult = checkIfHaveAnswer(botWord, match.words, global.dicData);
        if (!playerResult.hasAnswer) {
            // Bot wins
            await processPvpResult(match.guildId, null, match.turn, true);
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

const checkIfHaveAnswer = (word, usedWords, validDic) => {
    let w = word.split(/ +/);
    let lc = w[w.length - 1];
    
    for (let i = 0; i < validDic.length; i++) {
        let temp = validDic[i];
        let tempw = temp.split(/ +/);
        if (tempw.length > 1 && tempw[0] === lc && temp !== word) {
            if (!usedWords.includes(temp)) {
                return { hasAnswer: true, word: temp };
            }
        }
    }
    return { hasAnswer: false };
};

const getBotAnswer = (word, usedWords, validDic) => {
    let w = word.split(/ +/);
    let lc = w[w.length - 1];
    let possibleAnswers = [];
    
    for (let i = 0; i < validDic.length; i++) {
        let temp = validDic[i];
        let tempw = temp.split(/ +/);
        if (tempw.length > 1 && tempw[0] === lc && temp !== word) {
            if (!usedWords.includes(temp)) {
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
