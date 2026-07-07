const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const stats = require('../utils/stats');
const Player = require('../models/Player');
const Guild = require('../models/Guild');

const statsEmbed = async (client) => {
    const qCount = await stats.getQuery();
    const wCount = await stats.getWordPlayedCount();
    const rCount = await stats.getRoundPlayedCount();
    
    const totalPlayers = await Player.countDocuments();
    const totalGuilds = await Guild.countDocuments();

    return new EmbedBuilder()
        .setColor(13250094)
        .setThumbnail(client.user.avatarURL())
        .addFields(
            { name: ':satellite: Ping', value: client.ws.ping + 'ms', inline: true },
            { name: ':mag_right: Đã truy vấn', value: String(qCount), inline: true },
            { name: ':regional_indicator_a: Số từ đã nối', value: String(wCount), inline: true },
            { name: ':repeat: Số lượt đã chơi', value: String(rCount), inline: true },
            { name: ':busts_in_silhouette: Tổng người chơi', value: String(totalPlayers), inline: true },
            { name: ':shield: Tổng server chơi', value: String(totalGuilds), inline: true }
        );
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stats')
        .setDescription('Xem thống kê của Bot'),

    async execute(interaction, client) {
        await interaction.deferReply();
        const embed = await statsEmbed(client);
        await interaction.editReply({ embeds: [embed] });
    }
}