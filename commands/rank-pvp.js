const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Player = require('../models/Player');

const getPvpRankPage = (players, page, isEn, guildIcon) => {
    const embed = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle(`🏆 BẢNG XẾP HẠNG CAO THỦ SOLO ${isEn ? '(EN)' : '(VI)'} 🏆`)
        .setThumbnail(guildIcon || 'https://i.imgur.com/vHNSB1v.png')
        .setDescription(`Người chơi có số trận thắng đối kháng (1v1) ${isEn ? 'Tiếng Anh' : 'Tiếng Việt'} nhiều nhất server.\n\n`);

    if (players.length === 0) {
        embed.setDescription('Chưa có ai tham gia đấu Solo trong máy chủ này!');
        return embed;
    }

    let description = '';
    const start = page * 10;
    const end = Math.min(start + 10, players.length);

    for (let i = start; i < end; i++) {
        const player = players[i];
        const pvpWin = isEn ? (player.enPvpWin || 0) : (player.pvpWin || 0);
        const pvpLoss = isEn ? (player.enPvpLoss || 0) : (player.pvpLoss || 0);
        const pvpWinStreak = isEn ? (player.enPvpWinStreak || 0) : (player.pvpWinStreak || 0);

        let medal = '';
        if (i === 0) medal = '🥇';
        else if (i === 1) medal = '🥈';
        else if (i === 2) medal = '🥉';
        else medal = `**#${i + 1}**`;

        const winRate = (pvpWin + pvpLoss) > 0 
            ? Math.round((pvpWin / (pvpWin + pvpLoss)) * 100) 
            : 0;

        description += `${medal} | **${player.name || `<@${player.userId}>`}**\n`;
        description += `> ⚔️ **Thắng:** ${pvpWin} trận | ☠️ **Thua:** ${pvpLoss} trận\n`;
        description += `> 🔥 **Chuỗi thắng (Streak):** ${pvpWinStreak} | 🎯 **Tỉ lệ thắng:** ${winRate}%\n\n`;
    }

    embed.setDescription(embed.data.description + description);
    embed.setFooter({ text: `Trang ${page + 1}/${Math.ceil(players.length / 10) || 1}` });
    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank-pvp')
        .setDescription('Xem bảng xếp hạng các Cao thủ Solo 1v1 (PvP)')
        .addStringOption(option => 
            option.setName('language')
                .setDescription('Ngôn ngữ bảng xếp hạng')
                .setRequired(false)
                .addChoices(
                    { name: 'Tiếng Việt', value: 'vi' },
                    { name: 'English', value: 'en' }
                )
        ),

    async execute(interaction) {
        await interaction.deferReply();
        const guildId = interaction.guildId;
        const language = interaction.options && typeof interaction.options.getString === 'function' ? interaction.options.getString('language') : 'vi';
        const isEn = language === 'en';
        
        const sortField = isEn ? 'enPvpWin' : 'pvpWin';
        // Lấy tất cả player thay vì limit 10
        let players = await Player.find({ guildId }).sort({ [sortField]: -1 });
        
        // Filter out players with 0 matches
        players = players.filter(p => {
            const pWin = isEn ? (p.enPvpWin || 0) : (p.pvpWin || 0);
            const pLoss = isEn ? (p.enPvpLoss || 0) : (p.pvpLoss || 0);
            return pWin > 0 || pLoss > 0;
        });

        const totalPages = Math.ceil(players.length / 10) || 1;
        let currentPage = 0;
        const guildIcon = interaction.guild ? interaction.guild.iconURL({ dynamic: true }) : null;

        const embed = getPvpRankPage(players, currentPage, isEn, guildIcon);

        if (totalPages <= 1) {
            return await interaction.editReply({ embeds: [embed] });
        }

        const getRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('⬅️ Trước')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Sau ➡️')
                    .setStyle(ButtonStyle.Danger)
                    .setDisabled(page === totalPages - 1)
            );
        };

        const response = await interaction.editReply({ embeds: [embed], components: [getRow(currentPage)] });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, time: 60000 });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: 'Chỉ người gọi lệnh mới được dùng nút này!', ephemeral: true });
            }

            if (i.customId === 'prev_page') currentPage--;
            else if (i.customId === 'next_page') currentPage++;

            const newEmbed = getPvpRankPage(players, currentPage, isEn, guildIcon);
            await i.update({ embeds: [newEmbed], components: [getRow(currentPage)] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};
