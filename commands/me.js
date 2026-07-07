const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../models/Player');

const embedData = async (userId, guildId) => {
    const dataUser = await Player.findOne({ userId, guildId });
    if (!dataUser) {
        return [{
            name: 'Chưa có dữ liệu',
            value: 'Bạn chưa chơi nối từ ở server này bao giờ!'
        }];
    } else {
        const trueCount = dataUser.true || 0;
        const totalCount = dataUser.total || 0;
        const percentage = totalCount > 0 ? (trueCount / totalCount * 100).toFixed(1) : 0;
        
        const pvpWin = dataUser.pvpWin || 0;
        const pvpLoss = dataUser.pvpLoss || 0;
        const pvpTotal = pvpWin + pvpLoss;
        const pvpRate = pvpTotal > 0 ? (pvpWin / pvpTotal * 100).toFixed(1) : 0;
        const pvpStreak = dataUser.pvpWinStreak || 0;

        const normalRank = await Player.countDocuments({ guildId, win: { $gt: dataUser.win || 0 } }) + 1;
        const pvpRank = await Player.countDocuments({ guildId, pvpWin: { $gt: dataUser.pvpWin || 0 } }) + 1;

        const miniWin = dataUser.miniWin || 0;
        const miniTotal = dataUser.miniTotal || 0;
        const miniRate = miniTotal > 0 ? (miniWin / miniTotal * 100).toFixed(1) : 0;
        const miniRank = await Player.countDocuments({ guildId, miniWin: { $gt: miniWin } }) + 1;

        return [
            {
                name: `🎮 CHẾ ĐỘ THƯỜNG (Hạng #${normalRank})`,
                value: `🏆 **Thắng:** \`${dataUser.win || 0} ván\`\n✅ **Đã nối đúng:** \`${trueCount}/${totalCount} từ (${percentage}%)\``,
                inline: false
            },
            {
                name: `⚔️ CHẾ ĐỘ ĐẤU ĐƠN PvP (Hạng #${pvpRank})`,
                value: `🥇 **Thắng:** \`${pvpWin} trận\`\n💀 **Thua:** \`${pvpLoss} trận\`\n🔥 **Chuỗi thắng:** \`${pvpStreak} trận\`\n🎯 **Tỉ lệ thắng:** \`${pvpRate}%\``,
                inline: false
            },
            {
                name: `🧩 GHÉP TỪ (Hạng #${miniRank})`,
                value: `🥇 **Giải đúng:** \`${miniWin}/${miniTotal} lần\`\n🎯 **Tỉ lệ thắng:** \`${miniRate}%\``,
                inline: false
            }
        ];
    }
};

const meEmbed = async (interaction) => {
    const user = interaction.user || interaction.member.user;
    const guildId = interaction.guildId || interaction.guild.id;
    const fields = await embedData(user.id, guildId);
    return new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('HỒ SƠ NỐI TỪ CỦA ' + (user.displayName || user.username))
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .addFields(fields)
        .setTimestamp();
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Xem thống kê nối từ của bạn'),

    async execute(interaction, client) {
        await interaction.deferReply();
        const embed = await meEmbed(interaction);
        await interaction.editReply({ embeds: [embed] });
    }
};