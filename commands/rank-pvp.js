const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../models/Player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank-pvp')
        .setDescription('Xem bảng xếp hạng các Cao thủ Solo 1v1 (PvP)'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const players = await Player.find({ guildId }).sort({ pvpWin: -1 }).limit(10);

        if (players.length === 0) {
            return await interaction.reply('Chưa có ai tham gia đấu Solo trong máy chủ này!');
        }

        const embed = new EmbedBuilder()
            .setColor('#FF4500')
            .setTitle('🏆 BẢNG XẾP HẠNG CAO THỦ SOLO (PvP) 🏆')
            .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
            .setDescription('Top 10 người chơi có số trận thắng đối kháng (1v1) nhiều nhất server.\n\n');

        let description = '';
        players.forEach((player, index) => {
            let medal = '';
            if (index === 0) medal = '🥇';
            else if (index === 1) medal = '🥈';
            else if (index === 2) medal = '🥉';
            else medal = `**#${index + 1}**`;

            const winRate = (player.pvpWin + player.pvpLoss) > 0 
                ? Math.round((player.pvpWin / (player.pvpWin + player.pvpLoss)) * 100) 
                : 0;

            description += `${medal} | <@${player.userId}>\n`;
            description += `> ⚔️ **Thắng:** ${player.pvpWin} trận | ☠️ **Thua:** ${player.pvpLoss} trận\n`;
            description += `> 🔥 **Chuỗi thắng (Streak):** ${player.pvpWinStreak || 0} | 🎯 **Tỉ lệ thắng:** ${winRate}%\n\n`;
        });

        embed.setDescription(embed.data.description + description);

        await interaction.reply({ embeds: [embed] });
    }
};
