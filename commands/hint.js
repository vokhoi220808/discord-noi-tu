const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const Player = require('../models/Player');
const SoloMatch = require('../models/SoloMatch');
const ActiveGame = require('../models/ActiveGame');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hint')
        .setDescription('Tiêu 5 Xu 🪙 để nhận một gợi ý từ hợp lệ cho lượt hiện tại.'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        // Fetch Player data
        const player = await Player.findOne({ guildId, userId });
        if (!player || (player.coins || 0) < 5) {
            return await interaction.reply({ 
                content: `❌ Bạn không đủ Xu để mua gợi ý! (Cần 5 🪙, bạn đang có ${player ? player.coins || 0 : 0} 🪙)`, 
                flags: [MessageFlags.Ephemeral] 
            });
        }

        let words = [];
        let language = 'vi';
        let currentEvent = null;

        // Check Solo Match first
        const soloMatch = await SoloMatch.findOne({ channelId, status: 'playing' });
        if (soloMatch) {
            if (soloMatch.turn !== userId) {
                return await interaction.reply({ content: '❌ Chưa tới lượt của bạn trong trận Solo!', flags: [MessageFlags.Ephemeral] });
            }
            words = soloMatch.words;
            language = soloMatch.language || 'vi';
        } else {
            // Check Active Game
            const activeGame = await ActiveGame.findOne({ channelId, running: true });
            if (!activeGame) {
                return await interaction.reply({ content: '❌ Kênh này hiện không có ván nối từ nào đang diễn ra!', flags: [MessageFlags.Ephemeral] });
            }
            words = activeGame.words;
            language = activeGame.language || 'vi';
            currentEvent = activeGame.currentEvent;
        }

        if (words.length === 0) {
            return await interaction.reply({ content: '❌ Ván đấu chưa bắt đầu hoặc chưa có từ nào được nối!', flags: [MessageFlags.Ephemeral] });
        }

        const lastWord = words[words.length - 1];
        let expected = '';
        if (language === 'en' || (currentEvent && currentEvent.startsWith('LAST_LETTER'))) {
            expected = lastWord.slice(-1);
        } else {
            const splitted = lastWord.split(/\s+/);
            expected = splitted[splitted.length - 1];
        }

        let currentDicData = language === 'en' ? global.enDicData : global.dicData;
        let possibleAnswers = [];

        for (let i = 0; i < currentDicData.length; i++) {
            let temp = currentDicData[i];
            let isValid = false;

            if (language === 'en' || (currentEvent && currentEvent.startsWith('LAST_LETTER'))) {
                isValid = temp.startsWith(expected);
            } else {
                let tempw = temp.split(/\s+/);
                isValid = tempw.length > 1 && tempw[0] === expected;
            }

            if (isValid && temp !== lastWord && !words.includes(temp)) {
                if (currentEvent && currentEvent.startsWith('BAN_LETTER')) {
                    const bannedChar = currentEvent.split(':')[1];
                    const normalized = temp.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                    if (normalized.includes(bannedChar)) continue;
                }
                possibleAnswers.push(temp);
                if (possibleAnswers.length >= 50) break; // Lấy tối đa 50 từ để random cho nhẹ
            }
        }

        if (possibleAnswers.length === 0) {
            return await interaction.reply({ content: '❌ Rất tiếc, bot cũng bó tay! Không tìm ra được từ nào để gợi ý!', flags: [MessageFlags.Ephemeral] });
        }

        // Trừ tiền
        player.coins -= 5;
        await player.save();

        const hintWord = possibleAnswers[Math.floor(Math.random() * possibleAnswers.length)];
        await interaction.reply({ 
            content: `💡 **GỢI Ý (Đã trừ 5 🪙):** Bạn có thể thử từ: **\`${hintWord}\`**`, 
            flags: [MessageFlags.Ephemeral] 
        });
    }
};
