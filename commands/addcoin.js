const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const Player = require('../models/Player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addcoin')
        .setDescription('Admin: Bơm xu cho người chơi để test chức năng')
        .addUserOption(option => option.setName('user').setDescription('Chọn người chơi').setRequired(true))
        .addIntegerOption(option => option.setName('amount').setDescription('Số xu muốn thêm').setRequired(true)),
    async execute(interaction) {
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
            return interaction.reply({ content: '❌ Chỉ Admin Server mới có quyền in tiền!', flags: [MessageFlags.Ephemeral] });
        }
        
        const targetUser = interaction.options.getUser('user');
        const amount = interaction.options.getInteger('amount');
        
        if (!targetUser) {
            return interaction.reply({ content: '❌ Bạn chưa tag người dùng! Dùng lệnh: `!addcoin @user 1000`', flags: [MessageFlags.Ephemeral] });
        }

        await Player.updateOne(
            { guildId: interaction.guildId, userId: targetUser.id },
            { $inc: { coins: amount } },
            { upsert: true }
        );
        
        await interaction.reply(`✅ Ting ting! Đã bơm nóng **${amount} Xu** vào tài khoản của <@${targetUser.id}>. Chúc đại gia đi shopping vui vẻ! 🛒`);
    }
};
