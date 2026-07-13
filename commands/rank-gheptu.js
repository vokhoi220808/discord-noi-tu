const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../models/Player');

const rankEmbed = async (guildId, guildName) => {
    const list = await Player.find({ guildId }).sort({ miniWin: -1 }).limit(10);
    
    const embed = new EmbedBuilder()
        .setColor('#FFA500')
        .setTitle(`Bảng xếp hạng Ghép Từ máy chủ ${guildName}`)
        .setDescription('Top 10 cao thủ xếp chữ nhanh nhất')
        .setTimestamp();

    if (list.length === 0 || list[0].miniWin === 0) {
        embed.addFields({ name: 'Trống', value: 'Chưa có ai giải được từ nào!' });
    } else {
        let rankString = '';
        for (let i = 0; i < list.length; i++) {
            if (list[i].miniWin === 0) continue;
            
            let medal = '';
            if (i === 0) medal = '🥇';
            else if (i === 1) medal = '🥈';
            else if (i === 2) medal = '🥉';
            else medal = `**#${i + 1}**`;

            const miniWin = list[i].miniWin;
            const miniTotal = list[i].miniTotal || 0;
            const rate = miniTotal > 0 ? (miniWin / miniTotal * 100).toFixed(1) : 0;
            
            rankString += `${medal} <@${list[i].userId}> - **${miniWin}** lần giải đúng (Tỉ lệ: ${rate}%)\n\n`;
        }
        if (rankString) {
            embed.addFields({ name: 'Thành tích', value: rankString });
        }
    }

    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank-gheptu')
        .setDescription('Xem bảng xếp hạng Minigame Ghép Từ của Server'),

    async execute(interaction) {
        await interaction.deferReply();
        const guildId = interaction.guildId || interaction.guild.id;
        const guildName = interaction.guild ? interaction.guild.name : 'Discord';
        const embed = await rankEmbed(guildId, guildName);
        await interaction.editReply({ embeds: [embed] });
    }
};
