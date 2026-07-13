const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } = require('discord.js');
const Player = require('../models/Player');

// Ánh xạ ID khung sang tên và URL ảnh
const FRAME_URLS = {
    'frame_fire': 'https://i.imgur.com/XwzY7zC.png', // Thay bằng viền thực tế sau
    'frame_dragon': 'https://i.imgur.com/K5bQGzj.png',
    'frame_neon': 'https://i.imgur.com/PZ7E4qj.png',
    'frame_ice': 'https://i.imgur.com/7bA1vC2.png'
};

const FRAME_NAMES = {
    'frame_fire': '🔥 Khung Rực Lửa',
    'frame_dragon': '🐉 Khung Thần Long',
    'frame_neon': '🌌 Khung Neon',
    'frame_ice': '❄️ Khung Băng Giá'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inventory')
        .setDescription('Mở túi đồ và trang bị vật phẩm/khung avatar'),

    async execute(interaction) {
        // Alias
        if (interaction.commandName === 'inv') {
            // Support !inv
        }

        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        let player = await Player.findOne({ guildId, userId });
        if (!player) {
            return interaction.reply({ content: 'Túi đồ của bạn đang trống không. Hãy đến `/shop` mua sắm nhé!', flags: [MessageFlags.Ephemeral] });
        }

        const items = player.items || {};
        const bua_mien_tu = items.bua_mien_tu || 0;
        const x2_exp = items.x2_exp || 0;

        let expStatus = 'Không có hiệu ứng';
        if (player.expMultiplierUntil && new Date(player.expMultiplierUntil) > new Date()) {
            const timeLeft = Math.floor((new Date(player.expMultiplierUntil) - new Date()) / 1000 / 60 / 60);
            expStatus = `Đang kích hoạt (Còn ~${timeLeft} giờ)`;
        }

        const equipped = player.equippedFrame ? FRAME_NAMES[player.equippedFrame] : 'Không trang bị';

        const embed = new EmbedBuilder()
            .setColor('#10B981')
            .setTitle(`🎒 TÚI ĐỒ CỦA ${interaction.user.username.toUpperCase()}`)
            .setDescription('Dưới đây là các vật phẩm bạn đang sở hữu. Chọn từ menu để sử dụng vật phẩm hoặc trang bị Khung Avatar.')
            .addFields(
                { name: 'Vật phẩm hỗ trợ', value: `🛡️ Bùa Miễn Tử: **${bua_mien_tu}** cái\n⚡ Thẻ x2 EXP: **${x2_exp}** thẻ\n\n*Trạng thái x2 EXP: ${expStatus}*` },
                { name: 'Khung Avatar đang dùng', value: `> **${equipped}**` }
            );

        if (player.frames && player.frames.length > 0) {
            const frameList = player.frames.map(f => `• ${FRAME_NAMES[f]}`).join('\n');
            embed.addFields({ name: 'Khung Avatar sở hữu', value: frameList });
        } else {
            embed.addFields({ name: 'Khung Avatar sở hữu', value: 'Chưa có khung nào. Mua tại `/shop`.' });
        }

        // Tạo Menu
        const options = [];

        if (x2_exp > 0) {
            options.push({
                label: 'Sử dụng: Thẻ x2 EXP',
                description: 'Kích hoạt buff nhân đôi EXP trong 24 giờ',
                value: 'use_x2_exp',
                emoji: '⚡'
            });
        }

        if (player.frames && player.frames.length > 0) {
            player.frames.forEach(frameId => {
                options.push({
                    label: `Trang bị: ${FRAME_NAMES[frameId]}`,
                    description: 'Gắn khung này lên thẻ Profile (!me)',
                    value: `equip_${frameId}`
                });
            });
        }

        if (player.equippedFrame) {
            options.push({
                label: 'Tháo Khung Avatar',
                description: 'Trở về Avatar mặc định',
                value: 'unequip',
                emoji: '❌'
            });
        }

        if (options.length === 0) {
            return interaction.reply({ embeds: [embed] });
        }

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('inventory_use')
            .setPlaceholder('👉 Chọn thao tác...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60 * 1000
        });

        collector.on('collect', async i => {
            if (i.user.id !== userId) {
                return i.reply({ content: '❌ Đây không phải là túi đồ của bạn!', flags: [MessageFlags.Ephemeral] });
            }

            const action = i.values[0];
            player = await Player.findOne({ guildId, userId }); // refresh

            if (action === 'use_x2_exp') {
                if (!player.items || player.items.x2_exp <= 0) {
                    return i.reply({ content: '❌ Bạn không có Thẻ x2 EXP nào!', flags: [MessageFlags.Ephemeral] });
                }

                // Tiêu thụ thẻ
                player.items.x2_exp -= 1;
                player.markModified('items'); // Đảm bảo mongoose lưu obj lồng nhau

                // Cộng thêm 24h
                const now = new Date();
                let until = player.expMultiplierUntil && new Date(player.expMultiplierUntil) > now 
                            ? new Date(player.expMultiplierUntil) 
                            : now;
                until.setHours(until.getHours() + 24);
                player.expMultiplierUntil = until;

                await player.save();
                return i.reply({ content: '✅ Đã kích hoạt Thẻ x2 EXP thành công! Buff kéo dài 24 giờ kể từ hiện tại.', flags: [MessageFlags.Ephemeral] });
            }

            if (action.startsWith('equip_')) {
                const frameId = action.replace('equip_', '');
                if (!player.frames.includes(frameId)) {
                    return i.reply({ content: '❌ Bạn chưa sở hữu khung viền này.', flags: [MessageFlags.Ephemeral] });
                }

                player.equippedFrame = frameId;
                await player.save();
                return i.reply({ content: `✅ Đã trang bị **${FRAME_NAMES[frameId]}**. Gõ \`!me\` để chiêm ngưỡng ngay!`, flags: [MessageFlags.Ephemeral] });
            }

            if (action === 'unequip') {
                player.equippedFrame = '';
                await player.save();
                return i.reply({ content: '✅ Đã tháo khung Avatar.', flags: [MessageFlags.Ephemeral] });
            }
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
