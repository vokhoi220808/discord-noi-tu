<div align="center">
  <img src="https://media.discordapp.net/attachments/1118833917634351114/1119561957016399942/logo.png" alt="Logo" width="200"/>
  <h1>ĐỘ MIXI - DISCORD BOT NỐI TỪ V.I.P</h1>
  <p><i>Một siêu phẩm Bot nối từ Tiếng Việt tích hợp trí tuệ nhân tạo, minigame và bảng xếp hạng!</i></p>

  [![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
  [![Discord.js](https://img.shields.io/badge/Discord.js-v14-blue.svg)](https://discord.js.org/)
  [![MongoDB](https://img.shields.io/badge/Database-MongoDB-brightgreen.svg)](https://www.mongodb.com/)
  [![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
</div>

---

## 🌟 TÍNH NĂNG NỔI BẬT

Được xây dựng lại từ đầu và nâng cấp với hàng loạt tính năng xịn xò chưa từng có:

- 🎮 **Chế độ Chơi Chung & Random Events**: Mọi người cùng vào chung 1 kênh để nối từ liên hoàn. Đặc biệt, thỉnh thoảng Bot sẽ thả các **Sự Kiện Ngẫu Nhiên** như *Cấm Chữ Cái, x5 Điểm Thưởng, Lật Kèo (Nối bằng chữ cuối)* để thử thách trí não!
- 🏆 **Hệ Thống Kỷ Lục Server (Guinness)**: Bot tự động ghi nhớ và vinh danh chuỗi nối từ dài nhất lịch sử của máy chủ!
- ⚔️ **Chế độ Đấu Đơn (PvP 1vs1)**: Thách đấu người chơi khác với đồng hồ đếm ngược kịch tính (15s, 30s...). Chậm tay là thua!
- 🤖 **Đấu với Máy (PvE)**: Thách đấu trực tiếp với Bot Độ Mixi nếu không có ai chơi cùng.
- 🧩 **Minigame Ghép Từ**: Giải đố xáo trộn chữ cái với đồng hồ 60 giây. Cạnh tranh tốc độ với các thành viên khác!
- 🥇 **Hệ Thống Bảng Xếp Hạng Đa Chiều**: Xếp hạng riêng biệt cho Chơi Chung (`/rank`), Đấu Đơn (`/rank-pvp`), và Ghép Từ (`/rank-gheptu`).
- 📖 **Từ Điển Sống & Tự Khớp Lỗi**: Hơn **50,000+ từ ghép**. Tích hợp lệnh `/addword` để đóng góp từ mới và duyệt tự động bởi Admin.
- ⚡ **Hỗ trợ Song Song Prefix & Slash Command**: Dùng lệnh `/solo` hoặc gõ `!solo` đều được.
- 🚀 **Tích hợp Web Server**: Tích hợp mã nguồn chống ngủ gật, hỗ trợ treo Bot 24/7 hoàn toàn MIỄN PHÍ trên Render.com.

---

## 🛠️ YÊU CẦU HỆ THỐNG

Trước khi bắt đầu, hãy đảm bảo bạn đã cài đặt:
1. **[Node.js](https://nodejs.org/en/)** (Phiên bản v16.9.0 trở lên)
2. **[MongoDB](https://www.mongodb.com/)** (Tạo 1 Cluster miễn phí trên MongoDB Atlas)
3. **[Discord Bot Token](https://discord.com/developers/applications)** (Và nhớ bật tất cả các mục **Privileged Gateway Intents** cho Bot).

---

## 🚀 HƯỚNG DẪN CÀI ĐẶT (CHẠY TRÊN MÁY TÍNH)

**Bước 1:** Tải mã nguồn này về máy.

**Bước 2:** Mở Terminal (CMD) tại thư mục chứa Bot và chạy lệnh sau để tải các thư viện cần thiết:
```bash
npm install
```

**Bước 3:** Tạo 1 file có tên là `.env` ở thư mục gốc và dán nội dung sau vào:
```env
# Token của Bot Discord
BOT_TOKEN=YOUR_BOT_TOKEN_HERE

# Kênh gửi báo cáo và duyệt từ mới của Admin
REPORT_CHANNEL=1522921413642813480

# Đường dẫn Database MongoDB của bạn
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/botnoitu
```

**Bước 4:** Khởi chạy Bot!
```bash
node bot.js
```

---

## ☁️ HƯỚNG DẪN DEPLOY BOT 24/7 MIỄN PHÍ (RENDER + UPTIMEROBOT)

Bot đã được thiết kế sẵn 1 web server ẩn (`keep_alive.js`) để lách luật ngủ gật của Render. Bạn chỉ cần:

1. **Đẩy Code lên Github**.
2. **Tạo Web Service trên Render.com**:
   - Build Command: `npm install`
   - Start Command: `node bot.js` (hoặc `npm start`)
   - Thêm 3 biến môi trường y chang file `.env`.
3. **Treo máy**: Copy Link Website mà Render cấp cho bạn -> Lên trang **UptimeRobot.com** tạo 1 Monitor `HTTP` -> Dán link vào và cài 5 phút nháy 1 lần. 
🎉 Bot của bạn sẽ thức 24/24 hoàn toàn miễn phí!

---

## 📋 DANH SÁCH LỆNH (COMMANDS)

*Tất cả các lệnh đều có thể dùng bằng `!` hoặc `/`*

### ⚔️ Đấu Đơn & Minigame
| Lệnh | Mô tả |
| :--- | :--- |
| `/solo [@tag]` | Thách đấu 1vs1. Không tag = Chơi với máy |
| `/surrender` (`!ff`) | Nhận thua sớm trong một ván Solo |
| `/rank-pvp` | Xem Top 10 cao thủ thắng Solo nhiều nhất |
| `/gheptu` | Chơi giải đố sắp xếp chữ cái bị xáo trộn |
| `/rank-gheptu` | Bảng xếp hạng Minigame Ghép Từ |

### 🎮 Chơi Chung & Hệ Thống
| Lệnh | Mô tả |
| :--- | :--- |
| `/set-channel` | Cài đặt kênh mặc định để chơi nối từ (Yêu cầu Admin) |
| `!start` / `!stop` | Bắt đầu hoặc Dừng lượt chơi nối từ ở kênh chung |
| `/rank` | Bảng xếp hạng số lượng từ nối đúng trong Server |
| `/me` | Xem hồ sơ cá nhân và thứ hạng của bạn (ở cả 3 chế độ) |
| `/addword` | Gửi đề xuất đóng góp 1 từ mới chưa có vào từ điển |
| `/report` | Báo cáo 1 từ bị lỗi để Admin xem xét xoá bỏ |
| `/help` | Mở bảng hướng dẫn luật chơi chi tiết |

---

## 🤝 ĐÓNG GÓP & LIÊN HỆ

Sản phẩm được chỉnh sửa và nâng cấp với muôn vàn tâm huyết. Nếu bạn tìm thấy lỗi (Bug) hoặc muốn đóng góp ý tưởng mới, đừng ngần ngại **Tạo Pull Request** hoặc gửi **Issue** nhé! ❤️
