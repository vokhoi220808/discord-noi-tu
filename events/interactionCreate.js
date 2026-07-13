const { EmbedBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const CustomWord = require('../models/CustomWord');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        if (!interaction.isButton()) return;

        if (interaction.customId.startsWith('approve_word_') || interaction.customId.startsWith('reject_word_')) {
            // Check if user is admin (ManageGuild)
            if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) {
                return await interaction.reply({ content: '❌ Bạn không có quyền duyệt từ điển (Yêu cầu quyền Quản lý máy chủ)!', flags: [MessageFlags.Ephemeral] });
            }

            const action = interaction.customId.split('_')[0];
            const word = interaction.customId.split('_')[2];

            const oldEmbed = interaction.message.embeds[0];
            const embed = new EmbedBuilder(oldEmbed.data);

            if (action === 'approve') {
                if (global.dicData.includes(word)) {
                    return await interaction.reply({ content: 'Từ này đã có sẵn trong từ điển rồi!', flags: [MessageFlags.Ephemeral] });
                }

                // Save to DB
                try {
                    await CustomWord.create({ word: word, addedBy: 'admin' }); // Optionally extract actual user ID from embed description
                    global.dicData.push(word);
                } catch (e) {
                    console.error('Error saving custom word:', e);
                }

                embed.setColor('#00FF00')
                    .setTitle('✅ ĐÃ DUYỆT TỪ MỚI')
                    .setFooter({ text: `Được duyệt bởi ${interaction.user.tag}` });
                
                await interaction.update({ embeds: [embed], components: [] });
            } 
            else if (action === 'reject') {
                embed.setColor('#FF0000')
                    .setTitle('❌ ĐÃ TỪ CHỐI')
                    .setFooter({ text: `Bị từ chối bởi ${interaction.user.tag}` });
                
                await interaction.update({ embeds: [embed], components: [] });
            }
        }
    }
};
