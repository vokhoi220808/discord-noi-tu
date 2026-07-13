<h1 align="center">
  <br>
  🎮 NỐI TỪ BOT - ĐẲNG CẤP MAX PRO VIP 🚀
  <br>
</h1>

<h4 align="center">Một bot Discord trò chơi Nối Từ không chỉ là giải trí, mà là một trải nghiệm <kbd>Nhập Vai (RPG)</kbd> đích thực!</h4>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18.x-green.svg">
  <img src="https://img.shields.io/badge/Discord.js-v14-blue.svg">
  <img src="https://img.shields.io/badge/MongoDB-Powered-success.svg">
  <img src="https://img.shields.io/badge/Canvas-@napi--rs/canvas-orange.svg">
</p>

<p align="center">
  <a href="#tính-năng-nổi-bật">Tính năng</a> •
  <a href="#hướng-dẫn-cài-đặt">Cài đặt</a> •
  <a href="#danh-sách-lệnh">Danh sách lệnh</a> •
  <a href="#hệ-thống-kinh-tế-rpg">Hệ thống RPG</a>
</p>

---

## 🌟 Tính Năng Nổi Bật (Features)

Sự kết hợp hoàn hảo giữa luật chơi Nối Từ cổ điển và các cơ chế cày cuốc, mua sắm siêu cuốn hút:

- ⚔️ **Chế Độ Đối Kháng (Solo 1v1):** Thách đấu bạn bè với bộ đếm thời gian thực (15 giây). Bóp nghẹt đối thủ hoặc bị thời gian bóp nghẹt! Cày chuỗi thắng (Win Streak) để lấy danh hiệu.
- 👨‍👩‍👧‍👦 **Chế Độ Quần Chiến (Multiplayer):** Không giới hạn người chơi trong một kênh. Bot tự động theo dõi, vinh danh kỷ lục chuỗi nối dài nhất toàn Server!
- 🎴 **Thẻ Hồ Sơ Canvas "Glassmorphism":** Đẹp, mượt, sang trọng. Render siêu tốc bằng `@napi-rs/canvas`. Hệ thống tự động nhận diện và tính toán Level/EXP chuẩn game RPG (yêu cầu hàng triệu EXP để đạt Max Level 999).
- 🛒 **Cửa Hàng Vật Phẩm & Kho Đồ:** Dùng Tiền Xu kiếm được để mua *Bùa Miễn Tử*, *Thẻ x2 EXP* và *Khung Avatar VVIP*.
- 🖼️ **Cá Nhân Hóa Toàn Diện:** Tự do thay đổi Theme (Hình nền) cho thẻ Profile bằng mọi URL hình ảnh. Hệ thống tự động làm mờ (Vignette & Blur) cực kì chuyên nghiệp.
- 🎲 **Sự Kiện Ngẫu Nhiên (Random Events):** Bất ngờ xuất hiện trong lúc chơi chung: *Cấm Chữ*, *Lật Kèo (Nối chữ cái)*, *Kho Báu (x2, x3 Điểm)*.
- 🧩 **Minigame Ghép Từ:** Xáo trộn chữ cái để người chơi giải đố kiếm thêm Xu.

---

## 🚀 Hướng Dẫn Cài Đặt (Installation)

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/discord-noi-tu.git
   cd discord-noi-tu
   ```

2. **Cài đặt thư viện:**
   ```bash
   npm install
   ```

3. **Cấu hình môi trường (.env):**
   Tạo file `.env` ở thư mục gốc và điền các thông tin:
   ```env
   TOKEN=mã_token_discord_bot_của_bạn
   CLIENT_ID=id_của_bot
   MONGODB_URI=link_kết_nối_mongodb_của_bạn
   ```

4. **Khởi động Bot:**
   ```bash
   node .
   # hoặc dùng nodemon
   npm run dev
   ```

---

## 📜 Danh Sách Lệnh (Commands)

Bot hỗ trợ cả **Prefix** (`!`) và **Slash Commands** (`/`).

### 🎮 Chế Độ Chơi (Play)
- `/set-channel {kênh} {ngôn_ngữ}`: Gắn định kênh chơi Nối Từ (Chỉ Admin).
- `!start` / `!stop`: Bắt đầu / Kết thúc ván chơi chung.
- `/solo {@user} {lang}`: Thách đấu 1v1 hoặc đánh với Bot. (Mẹo: dùng `!solo @user vi`).
- `/surrender` hoặc `!ff`: Đầu hàng trong ván Solo.

### 🏆 Hồ Sơ & Xếp Hạng (Profile & Rank)
- `/me` hoặc `!me`: Hiển thị thẻ hồ sơ Xịn Xò (Level, EXP, Rank, Khung viền).
- `/rank`: Xem Bảng Xếp Hạng chế độ chơi chung.
- `/rank-pvp`: Xem Bảng Xếp Hạng Cao Thủ Solo.

### 🛍️ Hệ Thống Kinh Tế & Cửa Hàng (Economy & Shop)
- `/shop`: Mở cửa hàng mua vật phẩm (Bùa Miễn Tử, Thẻ x2, Khung Avatar).
- `/inventory` hoặc `!inv`: Mở túi đồ trang bị vật phẩm.
- `/theme {link}`: Đổi hình nền cho thẻ hồ sơ.
- `/hint` hoặc `!hint`: (Tốn 5 Xu) Bot sẽ gợi ý một từ để cứu nguy!

---

## 🛡️ Hệ Thống Kinh Tế RPG

- **Kiếm Xu:** Bạn kiếm được Xu thông qua việc Nối chữ đúng, Thắng ván Solo, hoặc giải đúng Minigame.
- **Bùa Miễn Tử:** Nếu bạn có Bùa Miễn Tử trong túi, khi đánh Solo mà bị hết giờ (Bí từ), Bùa sẽ tự động kích hoạt cứu mạng bạn 1 lần (Cho qua lượt không xử thua).
- **Thẻ x2 EXP:** Nhân đôi mọi kinh nghiệm thu được trong 24 giờ.
- **MAX LEVEL:** Điểm kinh nghiệm tích lũy vĩnh viễn theo công thức luỹ thừa. Đạt cấp độ 999 sẽ kích hoạt giao diện thanh EXP rực lửa hoàng kim!

---
<p align="center">
  <i>Được xây dựng với niềm đam mê dành cho cộng đồng Discord Việt Nam.</i>
</p>
