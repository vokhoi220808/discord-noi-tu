const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

async function generateProfileCard(user, dataUser, rankData) {
    const width = 1100;
    const height = 600;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    const fontFamily = '"Segoe UI", "Arial", sans-serif';

    // 1. DYNAMIC BACKGROUND (Custom Theme hoặc Blurred Avatar)
    let avatarImg;
    try {
        const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 512 });
        avatarImg = await loadImage(avatarUrl);
    } catch (e) {
        // Fallback
    }

    let customThemeImg;
    if (dataUser.theme && dataUser.theme.startsWith('http')) {
        try {
            customThemeImg = await loadImage(dataUser.theme);
        } catch (e) {
            console.error('Lỗi tải theme: ', e);
        }
    }

    if (customThemeImg) {
        ctx.save();
        // Không làm mờ quá nhiều nếu user dùng theme riêng, chỉ hơi giảm sáng để dễ nhìn chữ
        ctx.filter = 'blur(2px) brightness(0.55)';
        
        // Căn chỉnh ảnh (Scale to fill)
        const scale = Math.max(width / customThemeImg.width, height / customThemeImg.height);
        const cw = customThemeImg.width * scale;
        const ch = customThemeImg.height * scale;
        const cx = (width - cw) / 2;
        const cy = (height - ch) / 2;
        
        ctx.drawImage(customThemeImg, cx, cy, cw, ch);
        ctx.restore();
    } else if (avatarImg) {
        ctx.save();
        ctx.filter = 'blur(60px) brightness(0.4)';
        // Vẽ full màn hình
        ctx.drawImage(avatarImg, -100, -250, 1300, 1300);
        ctx.restore();
    } else {
        ctx.fillStyle = '#0B1120';
        ctx.fillRect(0, 0, width, height);
    }

    // Lớp màng mờ đen bên trên để làm nổi chữ (Vignette effect)
    const bgGrad = ctx.createRadialGradient(width/2, height/2, 200, width/2, height/2, 800);
    bgGrad.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
    bgGrad.addColorStop(1, 'rgba(2, 6, 23, 0.9)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Điểm xuyết Tech Lines mờ
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < width; i += 50) {
        ctx.moveTo(i, 0); ctx.lineTo(i, height);
    }
    for (let i = 0; i < height; i += 50) {
        ctx.moveTo(0, i); ctx.lineTo(width, i);
    }
    ctx.stroke();

    // 2. AVATAR (Có Neon Glow Bóng Đổ)
    const avatarX = 220;
    const avatarY = 170;
    const avatarRadius = 110;

    // Glowing shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 5, 0, Math.PI * 2);
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 40;
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();

    // Mask tròn cho Avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (avatarImg) {
        ctx.drawImage(avatarImg, avatarX - avatarRadius, avatarY - avatarRadius, avatarRadius * 2, avatarRadius * 2);
    }
    ctx.restore();

    // Vẽ Frame đè lên Avatar nếu người chơi đang trang bị Khung
    if (dataUser.equippedFrame) {
        ctx.save();
        ctx.translate(avatarX, avatarY);
        
        if (dataUser.equippedFrame === 'frame_fire') {
            const grad = ctx.createLinearGradient(-120, -120, 120, 120);
            grad.addColorStop(0, '#fca5a5');
            grad.addColorStop(0.5, '#ef4444');
            grad.addColorStop(1, '#7f1d1d');
            ctx.strokeStyle = grad;
            ctx.lineWidth = 15;
            ctx.beginPath();
            ctx.arc(0, 0, avatarRadius + 7, 0, Math.PI * 2);
            ctx.stroke();
            
            // Vẽ ngọn lửa nhỏ (gai)
            for(let i=0; i<12; i++) {
                ctx.rotate(Math.PI / 6);
                ctx.beginPath();
                ctx.moveTo(avatarRadius + 14, -5);
                ctx.lineTo(avatarRadius + 28, 0);
                ctx.lineTo(avatarRadius + 14, 5);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
            }
        } else if (dataUser.equippedFrame === 'frame_dragon') {
            ctx.strokeStyle = '#fbbf24'; // Gold
            ctx.lineWidth = 18;
            ctx.setLineDash([30, 10]); // Nét đứt vảy rồng
            ctx.beginPath();
            ctx.arc(0, 0, avatarRadius + 9, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
            // Viền mỏng
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, avatarRadius + 20, 0, Math.PI * 2);
            ctx.stroke();
        } else if (dataUser.equippedFrame === 'frame_neon') {
            ctx.strokeStyle = '#22d3ee'; // Cyan
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 20;
            ctx.lineWidth = 12;
            ctx.beginPath();
            ctx.arc(0, 0, avatarRadius + 6, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.strokeStyle = '#c084fc'; // Purple
            ctx.arc(0, 0, avatarRadius + 16, 0, Math.PI * 2);
            ctx.stroke();
        } else if (dataUser.equippedFrame === 'frame_ice') {
            ctx.strokeStyle = '#bae6fd'; // Light blue
            ctx.lineWidth = 14;
            ctx.beginPath();
            ctx.arc(0, 0, avatarRadius + 7, 0, Math.PI * 2);
            ctx.stroke();
            // Bông tuyết
            for(let i=0; i<8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.fillStyle = '#e0f2fe';
                ctx.beginPath();
                ctx.arc(avatarRadius + 15, 0, 6, 0, Math.PI*2);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    // Premium Avatar Ring (Gradient)
    const ringGrad = ctx.createLinearGradient(avatarX - avatarRadius, avatarY - avatarRadius, avatarX + avatarRadius, avatarY + avatarRadius);
    ringGrad.addColorStop(0, '#38BDF8');
    ringGrad.addColorStop(0.5, '#A78BFA');
    ringGrad.addColorStop(1, '#F472B6');
    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = ringGrad;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(avatarX, avatarY, avatarRadius + 14, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.stroke();

    // 3. USER INFO (Bên phải Avatar)
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 65px ${fontFamily}`;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 15;
    let name = user.displayName || user.username;
    if (name.length > 15) name = name.substring(0, 15) + '...';
    ctx.fillText(name.toUpperCase(), 370, 135);
    ctx.shadowBlur = 0;

    // Kẻ gạch dưới tên
    const lineGrad = ctx.createLinearGradient(370, 150, 670, 150);
    lineGrad.addColorStop(0, '#38BDF8');
    lineGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(370, 150, 300, 3);

    // TAGS Premium Gradient
    const drawPremiumTag = (x, y, text, color1, color2) => {
        ctx.font = `bold 16px ${fontFamily}`;
        const textWidth = ctx.measureText(text).width;
        const tagWidth = textWidth + 30;
        
        const grad = ctx.createLinearGradient(x, y, x + tagWidth, y + 28);
        grad.addColorStop(0, color1);
        grad.addColorStop(1, color2);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(x + 10, y);
        ctx.lineTo(x + tagWidth, y);
        ctx.lineTo(x + tagWidth - 10, y + 28);
        ctx.lineTo(x, y + 28);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.fillText(text, x + tagWidth / 2, y + 19);
        ctx.textAlign = 'left';
        
        return tagWidth + 15;
    };

    const viTrue = dataUser.true || 0;
    const enTrue = dataUser.enTrue || 0;
    const pvpWins = (dataUser.pvpWin || 0) + (dataUser.enPvpWin || 0);
    const miniWins = dataUser.miniWin || 0;
    const bonusExp = dataUser.bonusExp || 0;

    // Hệ thống tính EXP chuẩn RPG: Nối 1 từ = 1 EXP, Thắng PvP = 15 EXP, Giải đố = 5 EXP + Điểm thưởng x2 EXP
    const totalXP = viTrue + enTrue + (pvpWins * 15) + (miniWins * 5) + bonusExp;
    
    // Công thức XP = 15 * (Level - 1)^2
    let level = Math.floor(Math.sqrt(totalXP / 15)) + 1;
    if (level > 999) level = 999;
    
    // Tính toán kinh nghiệm Level
    const minXP = 15 * Math.pow(level - 1, 2);
    let nextLvlXP = 15 * Math.pow(level, 2); 
    
    let progress = 0;
    let expText = '';

    if (level >= 999) {
        progress = 1;
        expText = `Tối Đa: ${totalXP} EXP (MAX LEVEL)`;
        nextLvlXP = minXP;
    } else {
        progress = (totalXP - minXP) / (nextLvlXP - minXP);
        if (progress < 0) progress = 0;
        if (progress > 1) progress = 1;
        expText = `Điểm kinh nghiệm: ${totalXP} / ${nextLvlXP}`;
    }

    let tagX = 370;
    tagX += drawPremiumTag(tagX, 165, `LEVEL ${level}`, 'rgba(2, 132, 199, 0.8)', 'rgba(56, 189, 248, 0.4)');

    if ((dataUser.pvpWin || 0) + (dataUser.enPvpWin || 0) >= 100) {
        tagX += drawPremiumTag(tagX, 165, 'CHIẾN THẦN', 'rgba(202, 138, 4, 0.8)', 'rgba(250, 204, 21, 0.4)'); 
    }
    if ((dataUser.pvpWinStreak || 0) >= 10 || (dataUser.enPvpWinStreak || 0) >= 10) {
        tagX += drawPremiumTag(tagX, 165, 'BẤT BẠI', 'rgba(225, 29, 72, 0.8)', 'rgba(251, 113, 133, 0.4)'); 
    }
    if (totalXP >= 5000) {
        tagX += drawPremiumTag(tagX, 165, 'THÔNG THÁI', 'rgba(126, 34, 206, 0.8)', 'rgba(192, 132, 252, 0.4)'); 
    }

    // EXP Bar (Thanh tiến trình Level)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.roundRect(370, 215, 300, 8, 4);
    ctx.fill();

    const expGrad = ctx.createLinearGradient(370, 215, 670, 215);
    expGrad.addColorStop(0, level >= 999 ? '#F59E0B' : '#38BDF8'); // Nếu max lvl thì bar màu cam vàng
    expGrad.addColorStop(1, level >= 999 ? '#EF4444' : '#A78BFA');
    ctx.fillStyle = expGrad;
    ctx.beginPath();
    ctx.roundRect(370, 215, Math.max(15, 300 * progress), 8, 4);
    ctx.fill();

    ctx.fillStyle = level >= 999 ? '#FCD34D' : '#CBD5E1';
    ctx.font = `italic 14px ${fontFamily}`;
    ctx.fillText(expText, 370, 245);

    // 4. PREMIUM GLASSMORPHISM PANELS
    const drawPremiumGlassPanel = (px, py, pw, ph, title, statsArr, accentColor) => {
        // Shadow đen
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.6)'; // Kính đen mờ
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 16);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Nền mờ kính
        const pGrad = ctx.createLinearGradient(px, py, px, py + ph);
        pGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)');
        pGrad.addColorStop(1, 'rgba(255, 255, 255, 0.01)');
        ctx.fillStyle = pGrad;
        ctx.fill();

        // Viền panel tinh tế
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.stroke();

        // Thanh Header có màu
        ctx.beginPath();
        ctx.roundRect(px, py, pw, ph, 16);
        ctx.clip();
        ctx.fillStyle = accentColor;
        ctx.fillRect(px, py, pw, 42);

        ctx.fillStyle = '#FFFFFF';
        ctx.font = `bold 18px ${fontFamily}`;
        ctx.textAlign = 'center';
        ctx.fillText(title, px + pw / 2, py + 28);
        ctx.textAlign = 'left';

        // Điền chỉ số
        let currentY = py + 80;
        statsArr.forEach((stat, index) => {
            if (index > 0) {
                // Kẻ vạch chia dòng mờ
                ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
                ctx.fillRect(px + 20, currentY - 24, pw - 40, 1);
            }

            ctx.fillStyle = '#CBD5E1'; // Light slate
            ctx.font = `bold 15px ${fontFamily}`;
            ctx.fillText(stat.label, px + 20, currentY);

            ctx.fillStyle = stat.color || '#FFFFFF';
            ctx.font = `bold 19px ${fontFamily}`;
            ctx.textAlign = 'right';
            ctx.fillText(stat.value, px + pw - 20, currentY);
            ctx.textAlign = 'left';

            currentY += 38;
        });

        ctx.restore();
    };

    // Chuẩn bị dữ liệu tính toán (VI & EN)
    const winVi = dataUser.win || 0;
    const winEn = dataUser.enWin || 0;

    const viTotal = dataUser.total || 0;
    const viRate = viTotal > 0 ? ((viTrue / viTotal) * 100).toFixed(0) + '%' : '0%';

    const enTotal = dataUser.enTotal || 0;
    const enRate = enTotal > 0 ? ((enTrue / enTotal) * 100).toFixed(0) + '%' : '0%';

    const pvpViWin = dataUser.pvpWin || 0;
    const pvpViLoss = dataUser.pvpLoss || 0;
    const pvpViRate = (pvpViWin + pvpViLoss) > 0 ? ((pvpViWin / (pvpViWin + pvpViLoss)) * 100).toFixed(0) + '%' : '0%';
    const pvpViStreak = dataUser.pvpWinStreak || 0;

    const pvpEnWin = dataUser.enPvpWin || 0;
    const pvpEnLoss = dataUser.enPvpLoss || 0;
    const pvpEnRate = (pvpEnWin + pvpEnLoss) > 0 ? ((pvpEnWin / (pvpEnWin + pvpEnLoss)) * 100).toFixed(0) + '%' : '0%';
    const pvpEnStreak = dataUser.enPvpWinStreak || 0;

    const miniWin = dataUser.miniWin || 0;
    const miniTotal = dataUser.miniTotal || 0;
    const miniRate = miniTotal > 0 ? ((miniWin / miniTotal) * 100).toFixed(0) + '%' : '0%';

    // Căn đều 3 bảng bên dưới Avatar
    const pWidth = 310;
    const pMargin = 30;
    const startX = (width - (pWidth * 3 + pMargin * 2)) / 2;
    const pY = 320;
    const pH = 240;

    // Panel 1: Chế Độ Thường
    drawPremiumGlassPanel(startX, pY, pWidth, pH, 'CHẾ ĐỘ THƯỜNG', [
        { label: 'THẮNG (VI | EN)', value: `${winVi} | ${winEn}`, color: '#FCD34D' },
        { label: 'NỐI ĐÚNG (VI)', value: `${viTrue}/${viTotal} (${viRate})`, color: '#38BDF8' },
        { label: 'NỐI ĐÚNG (EN)', value: `${enTrue}/${enTotal} (${enRate})`, color: '#A7F3D0' },
        { label: 'HẠNG (VI | EN)', value: `#${rankData.viRank} | #${rankData.enRank}`, color: '#F472B6' }
    ], 'rgba(56, 189, 248, 0.7)'); // Màu Accent Cyan mờ

    // Panel 2: Đấu Đơn PvP
    drawPremiumGlassPanel(startX + pWidth + pMargin, pY, pWidth, pH, 'ĐẤU ĐƠN PVP', [
        { label: 'THẮNG/THUA (VI)', value: `${pvpViWin}/${pvpViLoss} (${pvpViRate})`, color: '#38BDF8' },
        { label: 'THẮNG/THUA (EN)', value: `${pvpEnWin}/${pvpEnLoss} (${pvpEnRate})`, color: '#A7F3D0' },
        { label: 'CHUỖI (VI | EN)', value: `${pvpViStreak} | ${pvpEnStreak}`, color: '#F97316' },
        { label: 'HẠNG (VI | EN)', value: `#${rankData.pvpRank} | #${rankData.enPvpRank}`, color: '#FCD34D' }
    ], 'rgba(244, 63, 94, 0.7)'); // Màu Accent Rose mờ

    // Panel 3: Khác & Ghép Từ
    drawPremiumGlassPanel(startX + (pWidth + pMargin) * 2, pY, pWidth, pH, 'MINIGAME & KHÁC', [
        { label: 'GIẢI ĐÚNG', value: `${miniWin}/${miniTotal}`, color: '#38BDF8' },
        { label: 'TỈ LỆ GIẢI', value: miniRate, color: '#A7F3D0' },
        { label: 'HẠNG GHÉP TỪ', value: `#${rankData.miniRank || 'N/A'}`, color: '#F472B6' },
        { label: 'TÀI SẢN (XU)', value: `${dataUser.coins || 0} Xu`, color: '#FCD34D' }
    ], 'rgba(16, 185, 129, 0.7)'); // Màu Accent Emerald mờ

    return await canvas.encode('png');
}

module.exports = { generateProfileCard };

module.exports = { generateProfileCard };
