const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Player = require('../models/Player');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('theme')
        .setDescription('Thay đổi hình nền (Background) thẻ hồ sơ cá nhân (!me)')
        .addStringOption(option => 
            option.setName('link')
                .setDescription('Link URL hình ảnh (png/jpg) hoặc gõ "default" để dùng ảnh mặc định')
                .setRequired(true)
        ),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const userId = interaction.user.id;
        let link = interaction.options.getString('link').trim();

        if (link.toLowerCase() === 'default') {
            await Player.findOneAndUpdate({ guildId, userId }, { theme: '' });
            return interaction.reply({ 
                content: '✅ Đã xóa Theme tùy chỉnh. Thẻ Profile của bạn đã quay về ảnh nền mặc định cực ngầu!',
                flags: [MessageFlags.Ephemeral] 
            });
        }

        // Kiểm tra xem có phải là link http/https cơ bản không
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
            return interaction.reply({ 
                content: '❌ Link hình ảnh không hợp lệ! Vui lòng cung cấp link có chứa `http://` hoặc `https://`.',
                flags: [MessageFlags.Ephemeral] 
            });
        }

        try {
            await Player.findOneAndUpdate(
                { guildId, userId },
                { theme: link },
                { upsert: true }
            );

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎨 CẬP NHẬT THEME THÀNH CÔNG')
                .setDescription('Hình nền thẻ thông tin cá nhân của bạn đã được thay đổi! Mời bạn dùng lệnh `/me` hoặc `!me` để tận hưởng.')
                .setImage(link)
                .setFooter({ text: 'Mẹo: Nếu ảnh quá to/nhỏ, hệ thống sẽ tự động tự động cắt để vừa vặn (Scale-to-fill).' });

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Lỗi khi cập nhật theme:', error);
            await interaction.reply({ 
                content: '❌ Đã xảy ra lỗi khi lưu hình nền. Vui lòng thử lại sau.',
                flags: [MessageFlags.Ephemeral] 
            });
        }
    }
};
