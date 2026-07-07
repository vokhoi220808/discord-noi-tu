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
    miniWin: { type: Number, default: 0 },
    miniTotal: { type: Number, default: 0 }
});

playerSchema.index({ guildId: 1, userId: 1 }, { unique: true });

module.exports = mongoose.model('Player', playerSchema);
