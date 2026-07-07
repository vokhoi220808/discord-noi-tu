const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const { setChannel } = require('../utils/channel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-channel')
        .setDescription('Cài đặt kênh chơi nối từ cho máy chủ')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('Chọn kênh bạn muốn cài đặt làm kênh nối từ')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    
    async execute(interaction, client) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
            return await interaction.reply({
                content: 'Bạn không có quyền thực hiện lệnh này. (Yêu cầu quyền Quản lý máy chủ)',
                flags: [MessageFlags.Ephemeral]
            });
        }

        const channel = interaction.options.getChannel('channel');
        
        try {
            await setChannel(interaction.guildId, channel.id);
            await interaction.reply({
                content: `Đã cài đặt kênh <#${channel.id}> làm kênh chơi nối từ!`,
                flags: [MessageFlags.Ephemeral]
            });
        } catch (error) {
            console.error('Error setting channel:', error);
            await interaction.reply({
                content: 'Có lỗi xảy ra khi lưu cấu hình kênh.',
                flags: [MessageFlags.Ephemeral]
            });
        }
    }
}