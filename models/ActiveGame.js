const mongoose = require('mongoose');

const activeGameSchema = new mongoose.Schema({
    channelId: { type: String, required: true, unique: true },
    language: { type: String, enum: ['vi', 'en'], default: 'vi' },
    running: { type: Boolean, default: false },
    words: { type: [String], default: [] },
    currentPlayer: {
        id: { type: String, default: null },
        name: { type: String, default: null }
    },
    currentEvent: { type: String, default: null },
    eventEndsAt: { type: Number, default: 0 }
});

module.exports = mongoose.model('ActiveGame', activeGameSchema);
