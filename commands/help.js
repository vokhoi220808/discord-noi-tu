const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem toàn bộ hướng dẫn và danh sách lệnh của Bot'),

    async execute(interaction) {
        const botAvatar = interaction.client.user?.displayAvatarURL() || 'https://cdn.discordapp.com/embed/avatars/0.png';

        const mainEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ name: 'Trung Tâm Trợ Giúp - Nối Từ Bot', iconURL: botAvatar })
            .setTitle('📚 DANH SÁCH LỆNH & HƯỚNG DẪN MỚI NHẤT')
            .setDescription('Chào mừng bạn đến với hệ sinh thái Nối Từ Max Pro VIP! Bot hỗ trợ cả **Tiếng Việt** và **Tiếng Anh**.\n\nVui lòng chọn một danh mục từ Menu bên dưới để xem chi tiết cách kích hoạt và chơi.\n\n*💡 Mẹo: Hầu hết các lệnh đều có thể dùng bằng cả Slash Command (`/`) và Prefix (`!`).*')
            .setThumbnail(botAvatar)
            .setFooter({ text: 'Được phát triển với ❤️ | Cập nhật hệ thống xu, thẻ VIP & gợi ý' })
            .setTimestamp();

        const options = [
            {
                label: 'Chơi Chung (Kênh)',
                description: 'Cách kích hoạt kênh và chơi nối từ nhiều người',
                value: 'multi',
                emoji: '🎮'
            },
            {
                label: 'Đấu Đơn PvP (Solo)',
                description: 'Hướng dẫn thách đấu 1v1 hoặc đấu với Bot',
                value: 'solo',
                emoji: '⚔️'
            },
            {
                label: 'Hồ Sơ & Xếp Hạng',
                description: 'Xem thẻ thông tin siêu VIP, Xu và BXH',
                value: 'rank',
                emoji: '🏆'
            },
            {
                label: 'Hỗ Trợ & Cửa Hàng',
                description: 'Lệnh gợi ý từ, báo lỗi, đóng góp',
                value: 'system',
                emoji: '💡'
            }
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('help_menu')
            .setPlaceholder('👉 Bấm vào đây để chọn danh mục...')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const response = await interaction.reply({
            embeds: [mainEmbed],
            components: [row],
            fetchReply: true
        });

        const collector = response.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
            time: 5 * 60 * 1000 // 5 minutes
        });

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) {
                return i.reply({ content: '❌ Bạn không thể dùng menu của người khác! Hãy gõ `/help` để mở menu của riêng bạn.', flags: [MessageFlags.Ephemeral] });
            }

            const selection = i.values[0];
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setAuthor({ name: 'Trung Tâm Trợ Giúp - Nối Từ Bot', iconURL: botAvatar });

            switch (selection) {
                case 'multi':
                    embed.setTitle('🎮 CÁCH KÍCH HOẠT CHẾ ĐỘ CHƠI CHUNG')
                         .setDescription('Để chơi nối từ không giới hạn cùng mọi người trong một kênh, Admin cần phải kích hoạt kênh đó trước. Mỗi kênh sẽ được gắn với **1 ngôn ngữ cố định**.')
                         .addFields(
                             { name: '1️⃣ `/set-channel {channel} {language}`', value: 'Lệnh Slash dành cho Admin để ấn định kênh chơi. (VD: Kênh A chơi Tiếng Việt, Kênh B chơi Tiếng Anh).' },
                             { name: '2️⃣ `!start`', value: 'Gõ lệnh này vào kênh đã được kích hoạt để bắt đầu ván chơi.' },
                             { name: '3️⃣ `!stop`', value: 'Dừng ván chơi hiện tại.' },
                             { name: '4️⃣ Lệnh Gợi ý (`/hint`)', value: 'Bị bí từ? Gõ `/hint` hoặc `!hint` để tốn 5 Xu và nhận 1 từ gợi ý hợp lệ nhé!' }
                         );
                    break;
                case 'solo':
                    embed.setTitle('⚔️ TÍNH NĂNG ĐẤU ĐƠN (SOLO PVP)')
                         .setDescription('Thể thức đối kháng 1v1 tính thời gian vô cùng căng thẳng. Thắng sẽ được thưởng cực nhiều Xu! (Lưu ý phải nhập đúng mẫu lệnh).')
                         .addFields(
                             { name: '`/solo {user} {language}`', value: 'Dùng lệnh Slash để thách đấu. \n- **user**: Bỏ trống nếu muốn đấu với Bot.\n- **language**: Bắt buộc chọn `vi` (Tiếng Việt) hoặc `en` (Tiếng Anh).' },
                             { name: '`!solo {@user} {language}`', value: 'Cách dùng nhanh bằng tin nhắn thường. **Bắt buộc y mẫu**. Ví dụ: `!solo @VoKhoi vi` hoặc `!solo @bot en`' },
                             { name: '`/surrender` hoặc `!ff`', value: 'Đầu hàng và kết thúc sớm ván đấu.' },
                             { name: '💡 Dùng Gợi Ý', value: 'Bạn hoàn toàn có thể lật kèo bằng cách dùng lệnh `/hint` hoặc `!hint` (Tốn 5 Xu).' }
                         );
                    break;
                case 'rank':
                    embed.setTitle('🏆 XẾP HẠNG & HỒ SƠ VIP')
                         .setDescription('Hệ thống thống kê chi tiết với thẻ Profile ảnh động siêu VIP. BXH được tách riêng giữa Tiếng Việt và Tiếng Anh.')
                         .addFields(
                             { name: '`/me [user]` hoặc `!me [@user]`', value: 'Hiển thị **Thẻ Ảnh Hồ Sơ Max Pro VIP** của bản thân hoặc người khác. Thẻ hiển thị số Tiền Xu, Level, Rank và các Danh hiệu chiến thần.' },
                             { name: '`/rank [ngôn_ngữ]`', value: 'Xem Bảng xếp hạng số lượng nối từ Chế Độ Chung. Hỗ trợ lật trang ⬅️ ➡️.' },
                             { name: '`/rank-pvp [ngôn_ngữ]`', value: 'Xem Bảng xếp hạng Đấu Đơn (PvP). Hỗ trợ lật trang ⬅️ ➡️.' },
                             { name: '`/gheptu [ngôn_ngữ]`', value: 'Chơi Minigame giải đố xáo trộn chữ cái kiếm thêm Xu.' },
                             { name: '`/rank-gheptu`', value: 'Bảng xếp hạng Minigame Ghép Từ.' }
                         );
                    break;
                case 'system':
                    embed.setTitle('💡 HỖ TRỢ, TIỀN TỆ & CỬA HÀNG')
                         .setDescription('Quản lý bot, tài sản và cá nhân hóa giao diện.')
                         .addFields(
                             { name: '🪙 Hệ Thống Xu (Coins)', value: 'Mỗi lần nối từ đúng hoặc thắng Solo, bạn sẽ nhận được Xu. Xu dùng để mua sắm.' },
                             { name: '`/shop` hoặc `!shop`', value: 'Mở cửa hàng để sắm Bùa Miễn Tử, Thẻ x2 EXP, và các Khung Avatar VVIP.' },
                             { name: '`/inventory` hoặc `!inv`', value: 'Mở túi đồ, quản lý vật phẩm, sử dụng buff x2 EXP hoặc Trang bị Khung Avatar.' },
                             { name: '`/theme [link_ảnh]`', value: 'Cá nhân hóa! Thay đổi hình nền thẻ `!me` bằng link ảnh bất kỳ, hoặc gõ `default` để về mặc định.' },
                             { name: '`/hint` hoặc `!hint`', value: 'Tiêu tốn 5 Xu để nhận gợi ý từ trong lúc bí bách.' },
                             { name: '`/addword <từ>`', value: 'Góp từ mới vào từ điển nếu bot chưa biết (Chờ duyệt).' }
                         );
                    break;
            }

            embed.setFooter({ text: 'Mẹo: Dùng /help lại bất cứ lúc nào bạn cần!' });

            await i.update({ embeds: [embed], components: [row] });
        });

        collector.on('end', async () => {
            const disabledRow = new ActionRowBuilder().addComponents(
                selectMenu.setDisabled(true).setPlaceholder('⏳ Menu đã hết hạn sử dụng.')
            );
            await interaction.editReply({ components: [disabledRow] }).catch(() => {});
        });
    }
};