const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const SoloMatch = require('../models/SoloMatch');
const SoloEngine = require('../services/SoloEngine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('surrender')
        .setDescription('Đầu hàng trong trận đấu Solo (Hoặc dùng /ff)'),

    async execute(interaction) {
        const channelId = interaction.channelId;
        const userId = interaction.user.id;

        const match = await SoloMatch.findOne({ channelId });
        
        if (!match) {
            return await interaction.reply({ content: '❌ Hiện tại không có trận đấu Solo nào đang diễn ra ở kênh này!', flags: [MessageFlags.Ephemeral] });
        }

        if (match.player1 !== userId && match.player2 !== userId) {
            return await interaction.reply({ content: '❌ Bạn không phải là người chơi trong trận Solo này!', flags: [MessageFlags.Ephemeral] });
        }

        if (match.status !== 'playing') {
            return await interaction.reply({ content: '❌ Trận đấu chưa chính thức bắt đầu (đang chờ phản hồi).', flags: [MessageFlags.Ephemeral] });
        }

        // Clear the active timer
        if (global.soloTimers && global.soloTimers[channelId]) {
            clearTimeout(global.soloTimers[channelId]);
            delete global.soloTimers[channelId];
        }

        const winnerId = match.player1 === userId ? match.player2 : match.player1;
        
        // Update database
        await SoloEngine.processPvpResult(match.guildId, winnerId, userId, match.player2 === null);
        await SoloMatch.deleteOne({ channelId });

        const embed = new EmbedBuilder()
            .setColor('#8B0000')
            .setTitle('🏳️ ĐẦU HÀNG')
            .setDescription(`<@${userId}> đã chấp nhận giương cờ trắng đầu hàng!\n\n🏆 **Người chiến thắng:** ${winnerId ? `<@${winnerId}>` : '**Độ Mixi**'}`);

        await interaction.reply({ embeds: [embed] });
    }
};
