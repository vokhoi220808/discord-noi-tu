const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
    guildId: { type: String, required: true },
    userId: { type: String, required: true },
    name: { type: String },
    avatar: { type: String },
    win: { type: Number, default: 0 },
    true: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    pvpWin: { type: Number, default: 0 },
    pvpLoss: { type: Number, default: 0 },
    pvpWinStreak: { type: Number, default: 0 },
    enWin: { type: Number, default: 0 },
    enTrue: { type: Number, default: 0 },
    enTotal: { type: Number, default: 0 },
    enPvpWin: { type: Number, default: 0 },
    enPvpLoss: { type: Number, default: 0 },
    enPvpWinStreak: { type: Number, default: 0 },
    miniWin: { type: Number, default: 0 },
    miniTotal: { type: Number, default: 0 },
    coins: { type: Number, default: 0 },
    theme: { type: String, default: '' },
    
    // Inventory & Shop System
    items: {
        bua_mien_tu: { type: Number, default: 0 },
        x2_exp: { type: Number, default: 0 }
    },
    expMultiplierUntil: { type: Date, default: null },
    bonusExp: { type: Number, default: 0 },
    
    // Avatar Frames
    frames: { type: [String], default: [] }, // Danh sách ID các khung viền đã mua
    equippedFrame: { type: String, default: '' }
});

playerSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Player', playerSchema);
