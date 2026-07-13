const { SlashCommandBuilder, EmbedBuilder, Client } = require('discord.js')
const Guild = require('../models/Guild');

const serverEmbed = async (interaction, client) => {
    const guild = interaction.member.guild;
    const owner = await guild.fetchOwner();
    const guildData = await Guild.findOne({ guildId: interaction.guildId });
    const isPremium = guildData ? guildData.premium : false;
    
    return new EmbedBuilder()
        .setColor(13250094)
        .setAuthor({
            name: guild.name,
            iconURL: guild.iconURL({ dynamic: true })
        })
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .addFields(
            { name: ':id: ID Server', value: interaction.guildId, inline: true },
            { name: ':calendar: Thành lập', value: `<t:${Math.floor(Date.parse(guild.createdAt) / 1000)}:R>`, inline: true },
            { name: ':crown: Owner', value: `<@${guild.ownerId}>`, inline: true },
            { name: ':robot: Ngày thêm Bot', value: `<t:${Math.floor(Date.parse(guild.joinedAt) / 1000)}:R>`, inline: true },
            { name: ':star: PhoBo Premium', value: isPremium ? ':white_check_mark: Đã kích hoạt' : ':closed_lock_with_key: Chưa kích hoạt', inline: true }
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server')
        .setDescription('Xem thông tin máy chủ'),

    async execute (interaction, client) {
        await interaction.deferReply();
        const embed = await serverEmbed(interaction, client);
        await interaction.editReply({ embeds: [embed] });
    }
}