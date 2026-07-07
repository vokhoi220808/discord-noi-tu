const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addword')
        .setDescription('Đề xuất thêm một từ mới vào từ điển')
        .addStringOption(option => 
            option.setName('word')
                .setDescription('Từ ghép 2 âm tiết (VD: xin chào)')
                .setRequired(true)
        ),

    async execute(interaction) {
        let word = interaction.options.getString('word');
        if (!word) word = '';
        
        word = word.trim().toLowerCase();
        const syllables = word.split(/\s+/).filter(Boolean);

        if (syllables.length !== 2) {
            return await interaction.reply({ content: '❌ Từ bạn đề xuất phải là từ ghép có chính xác 2 tiếng!', flags: [MessageFlags.Ephemeral] });
        }

        if (global.dicData.includes(word)) {
            return await interaction.reply({ content: '❌ Từ này đã tồn tại trong từ điển rồi!', flags: [MessageFlags.Ephemeral] });
        }

        const reportChannelId = process.env.REPORT_CHANNEL;
        if (!reportChannelId) {
            return await interaction.reply({ content: '❌ Tính năng này hiện đang bảo trì (Chưa cấu hình REPORT_CHANNEL).', flags: [MessageFlags.Ephemeral] });
        }

        const reportChannel = interaction.client.channels.cache.get(reportChannelId);
        if (!reportChannel) {
            return await interaction.reply({ content: '❌ Tính năng này hiện đang bảo trì (Không tìm thấy kênh duyệt).', flags: [MessageFlags.Ephemeral] });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('📝 ĐỀ XUẤT TỪ MỚI')
            .setDescription(`**Từ đề xuất:** \`${word}\`\n**Người đề xuất:** <@${interaction.user.id}>\n**ID Người dùng:** ${interaction.user.id}`)
            .setTimestamp();

        const approveBtn = new ButtonBuilder()
            .setCustomId(`approve_word_${word}`)
            .setLabel('Duyệt')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const rejectBtn = new ButtonBuilder()
            .setCustomId(`reject_word_${word}`)
            .setLabel('Từ chối')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const row = new ActionRowBuilder().addComponents(approveBtn, rejectBtn);

        await reportChannel.send({ embeds: [embed], components: [row] });
        await interaction.reply({ content: `✅ Đã gửi từ **"${word}"** cho Admin phê duyệt! Cảm ơn sự đóng góp của bạn.`, flags: [MessageFlags.Ephemeral] });
    }
};
