const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } = require('discord.js');
const Player = require('../models/Player');

const SHOP_ITEMS = {
    'bua_mien_tu': { name: '🛡️ Bùa Miễn Tử', price: 100, type: 'item', desc: 'Tự động cứu mạng bạn 1 lần khi hết giờ nối từ.' },
    'x2_exp': { name: '⚡ Thẻ x2 EXP', price: 300, type: 'item', desc: 'Nhân đôi kinh nghiệm (EXP) nhận được trong 24 giờ.' },
    'frame_fire': { name: '🔥 Khung Viền Rực Lửa', price: 1000, type: 'frame', desc: 'Khung Avatar bốc lửa cực ngầu (Dùng trong !me).' },
    'frame_dragon': { name: '🐉 Khung Viền Thần Long', price: 1500, type: 'frame', desc: 'Khung Avatar rồng vàng VIP.' },
    'frame_neon': { name: '🌌 Khung Viền Neon Tương Lai', price: 800, type: 'frame', desc: 'Khung viền công nghệ Cyberpunk.' },
    'frame_ice': { name: '❄️ Khung Viền Băng Giá', price: 800, type: 'frame', desc: 'Khung viền đóng băng lạnh lẽo.' }
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Cửa hàng Vật Phẩm và Khung Avatar'),

    async execute(interaction) {
        const guildId = interaction.guildId;
        const userId = interaction.user.id;

        let player = await Player.findOne({ guildId, userId });
        if (!player) {
            player = await Player.create({ guildId, userId, coins: 0 });
        }

        const embed = new EmbedBuilder()
            .setColor('#FBBF24')
            .setTitle('🛒 CỬA HÀNG VẬT PHẨM MAX PRO VIP')
            .setDescription(`Chào mừng bạn đến với Cửa Hàng!\n💰 **Tài khoản của bạn:** \`${player.coins} Xu\`\n\nHãy chọn vật phẩm bạn muốn mua từ Menu bên dưới.`)
            .addFields(
                { name: 'Vật Phẩm Hỗ Trợ (Tiêu hao)', value: '🛡️ Bùa Miễn Tử: 100 Xu\n⚡ Thẻ x2 EXP: 300 Xu' },
                { name: 'Khung Avatar (Dùng vĩnh viễn)', value: '🔥 Khung Rực Lửa: 1000 Xu\n🐉 Khung Thần Long: 1500 Xu\n🌌 Khung Neon: 800 Xu\n❄️ Khung Băng Giá: 800 Xu' }
            )
            .setFooter({ text: 'Mẹo: Dùng /inventory hoặc !inv để xem túi đồ của bạn.' });

        const options = Object.keys(SHOP_ITEMS).map(id => ({
            label: `${SHOP_ITEMS[id].name} - ${SHOP_ITEMS[id].price} Xu`,
            description: SHOP_ITEMS[id].desc,
            value: id
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('shop_buy')
            .setPlaceholder('👉 Chọn vật phẩm để mua...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [embed],
            components: [row],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 60 * 1000
        });

        collector.on('collect', async i => {
            if (i.user.id !== userId) {
                return i.reply({ content: '❌ Đây không phải là cửa hàng của bạn!', flags: [MessageFlags.Ephemeral] });
            }

            const itemId = i.values[0];
            const item = SHOP_ITEMS[itemId];

            // Cập nhật lại số dư mới nhất
            player = await Player.findOne({ guildId, userId });

            if (player.coins < item.price) {
                return i.reply({ content: `❌ Bạn không có đủ Xu! Cần thêm **${item.price - player.coins} Xu** để mua vật phẩm này.`, flags: [MessageFlags.Ephemeral] });
            }

            if (item.type === 'frame') {
                if (player.frames.includes(itemId)) {
                    return i.reply({ content: `❌ Bạn đã sở hữu ${item.name} rồi! Vui lòng dùng \`/inventory\` để trang bị.`, flags: [MessageFlags.Ephemeral] });
                }
                player.frames.push(itemId);
            } else {
                if (!player.items) player.items = {};
                player.items[itemId] = (player.items[itemId] || 0) + 1;
            }

            player.coins -= item.price;
            await player.save();

            await i.reply({ content: `✅ Chúc mừng! Bạn đã mua thành công **${item.name}** với giá **${item.price} Xu**. Số Xu còn lại: **${player.coins} Xu**.`, flags: [MessageFlags.Ephemeral] });

            // Cập nhật lại embed
            embed.setDescription(`Chào mừng bạn đến với Cửa Hàng!\n💰 **Tài khoản của bạn:** \`${player.coins} Xu\`\n\nHãy chọn vật phẩm bạn muốn mua từ Menu bên dưới.`);
            await interaction.editReply({ embeds: [embed] }).catch(() => {});
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(selectMenu.setDisabled(true));
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};
