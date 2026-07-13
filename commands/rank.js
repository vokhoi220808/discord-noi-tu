const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const Player = require('../models/Player');

const getRankPage = (players, page, isEn, guildName, guildIcon, requestedBy) => {
    const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle(`🏆 BẢNG XẾP HẠNG NỐI TỪ ${isEn ? '(ENGLISH)' : '(TIẾNG VIỆT)'} 🏆`)
        .setAuthor({
            name: guildName,
            iconURL: guildIcon || 'https://cdn.discordapp.com/embed/avatars/0.png'
        })
        .setThumbnail(guildIcon || 'https://i.imgur.com/vHNSB1v.png')
        .setTimestamp()
        .setFooter({ 
            text: `Trang ${page + 1}/${Math.ceil(players.length / 10) || 1} • Yêu cầu bởi ${requestedBy.username}`, 
            iconURL: requestedBy.displayAvatarURL({ dynamic: true }) 
        });

    if (players.length === 0) {
        embed.setDescription('Chưa có ai chơi nối từ chế độ này ở server.');
        return embed;
    }

    let description = '';
    const start = page * 10;
    const end = Math.min(start + 10, players.length);

    for (let i = start; i < end; i++) {
        const player = players[i];
        const trueCount = isEn ? (player.enTrue || 0) : (player.true || 0);
        const totalCount = isEn ? (player.enTotal || 0) : (player.total || 0);
        const winCount = isEn ? (player.enWin || 0) : (player.win || 0);
        
        const percentage = totalCount > 0 ? ((trueCount / totalCount) * 100).toFixed(1) : 0;
        
        let medal = '';
        if (i === 0) medal = '🥇';
        else if (i === 1) medal = '🥈';
        else if (i === 2) medal = '🥉';
        else medal = `**#${i + 1}**`;

        description += `${medal} **${player.name || `<@${player.userId}>`}**\n`;
        description += `└ 🏆 Thắng: \`${winCount}\` • 🎯 Tỉ lệ: \`${trueCount}/${totalCount} (${percentage}%)\`\n\n`;
    }

    embed.setDescription(description);
    return embed;
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Xem bảng xếp hạng nối từ')
        .addStringOption(option => 
            option.setName('language')
                .setDescription('Ngôn ngữ bảng xếp hạng')
                .setRequired(false)
                .addChoices(
                    { name: 'Tiếng Việt', value: 'vi' },
                    { name: 'English', value: 'en' }
                )
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        const language = interaction.options && typeof interaction.options.getString === 'function' ? interaction.options.getString('language') : 'vi';
        const isEn = language === 'en';
        
        const allPlayers = await Player.find({ guildId: interaction.guildId });
        
        const rankOfServer = allPlayers.filter(p => {
            const winCount = isEn ? (p.enWin || 0) : (p.win || 0);
            const totalCount = isEn ? (p.enTotal || 0) : (p.total || 0);
            return winCount > 0 || totalCount > 0;
        }).sort((a, b) => {
            const aWin = isEn ? (a.enWin || 0) : (a.win || 0);
            const bWin = isEn ? (b.enWin || 0) : (b.win || 0);
            if (bWin !== aWin) return bWin - aWin;

            const aTotal = isEn ? (a.enTotal || 0) : (a.total || 0);
            const bTotal = isEn ? (b.enTotal || 0) : (b.total || 0);
            const aTrue = isEn ? (a.enTrue || 0) : (a.true || 0);
            const bTrue = isEn ? (b.enTrue || 0) : (b.true || 0);

            const aAccuracy = aTotal === 0 ? 0 : aTrue / aTotal;
            const bAccuracy = bTotal === 0 ? 0 : bTrue / bTotal;
            if (bAccuracy !== aAccuracy) return bAccuracy - aAccuracy;
            return bTrue - aTrue;
        });

        const totalPages = Math.ceil(rankOfServer.length / 10) || 1;
        let currentPage = 0;

        const guildName = interaction.guild ? interaction.guild.name : 'Server';
        const guildIcon = interaction.guild ? interaction.guild.iconURL({ dynamic: true }) : null;
        const requestedBy = interaction.user;

        const embed = getRankPage(rankOfServer, currentPage, isEn, guildName, guildIcon, requestedBy);

        if (totalPages <= 1) {
            return await interaction.editReply({ embeds: [embed] });
        }

        const getRow = (page) => {
            return new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId('prev_page')
                    .setLabel('⬅️ Trước')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(page === 0),
                new ButtonBuilder()
                    .setCustomId('next_page')
                    .setLabel('Sau ➡️')
                    .setStyle(ButtonStyle.Primary)
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

            const newEmbed = getRankPage(rankOfServer, currentPage, isEn, guildName, guildIcon, requestedBy);
            await i.update({ embeds: [newEmbed], components: [getRow(currentPage)] });
        });

        collector.on('end', () => {
            interaction.editReply({ components: [] }).catch(() => {});
        });
    }
};