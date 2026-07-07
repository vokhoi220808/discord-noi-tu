const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

const helpEmbed = () => new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle('📚 BẢNG HƯỚNG DẪN CÁC LỆNH CỦA ĐỘ MIXI')
    .setDescription('Tất cả các lệnh dưới đây đều có thể dùng bằng **`/`** hoặc **`!`** (ví dụ: `/solo` hoặc `!solo`).')
    .addFields(
        {
            name: '⚔️ TÍNH NĂNG ĐẤU ĐƠN (SOLO & BẢNG XẾP HẠNG)',
            value: '• `/solo [@NguờiChơi]`: Mời người khác đấu tay đôi có tính giờ, hoặc đấu với Bot (Độ Mixi) nếu không tag ai.\n• `/surrender` hoặc `!ff`: Chịu thua trong ván Solo.\n• `/rank-pvp`: Xem Bảng xếp hạng các cao thủ thắng Solo nhiều nhất.\n• `/me`: Xem hồ sơ cá nhân và thứ hạng của bạn (cả 2 chế độ).',
            inline: false
        },
        {
            name: '🎮 CHẾ ĐỘ NỐI TỪ CHUNG',
            value: '• `/set-channel`: (Admin) Đặt kênh mặc định để chơi nối từ chung không giới hạn thời gian.\n• `!start`: Bắt đầu ván chơi mới tại kênh chung.\n• `!stop`: Dừng ván chơi hiện tại tại kênh chung (Cần quyền quản lý tin nhắn).\n• `/rank`: Xem bảng xếp hạng nối từ chung (số từ nối được).',
            inline: false
        },
        {
            name: '🧩 MINIGAME GHÉP TỪ',
            value: '• `/gheptu`: Chơi giải đố xáo trộn chữ cái (có tính giờ).\n• `/rank-gheptu`: Xem bảng xếp hạng những người giải đố nhanh nhất.',
            inline: false
        },
        {
            name: '📖 TỪ ĐIỂN & HỆ THỐNG',
            value: '• `/addword <từ>`: Đóng góp từ mới vào từ điển (Chờ Admin duyệt).\n• `/report <từ>`: Báo cáo từ ghép không hợp lệ (sai chính tả, vô nghĩa).\n• `/stats`: Xem tổng số lượng người dùng và máy chủ của Bot.\n• `/help`: Hiển thị bảng hướng dẫn này.',
            inline: false
        }
    )
    .setFooter({ text: 'Chúc bạn chơi nối từ vui vẻ cùng Độ Mixi! 🚀' })

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Xem hướng dẫn sử dụng BOT'),
    async execute(interaction) {
        await interaction.reply({
            embeds: [helpEmbed()],
            flags: [4096]
        })
    }
}