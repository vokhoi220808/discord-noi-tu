const mongoose = require('mongoose');

const soloMatchSchema = new mongoose.Schema({
    channelId: { type: String, required: true }, // 1 channel only 1 active solo match at a time
    guildId: { type: String, required: true },
    language: { type: String, enum: ['vi', 'en'], default: 'vi' },
    player1: { type: String, required: true }, // User ID
    player2: { type: String, default: null }, // User ID, if null then it's Bot
    status: { type: String, enum: ['waiting', 'playing'], default: 'waiting' },
    timeLimit: { type: Number, default: 30 }, // In seconds. 0 means infinite
    turn: { type: String, default: null }, // User ID of the player whose turn it is
    words: { type: [String], default: [] },
    messageId: { type: String, default: null }, // Invite message ID
    createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto delete after 24h
});

// A channel can only have one solo match at a time
soloMatchSchema.index({ channelId: 1 }, { unique: true });

module.exports = mongoose.model('SoloMatch', soloMatchSchema);
