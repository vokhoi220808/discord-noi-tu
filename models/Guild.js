const mongoose = require('mongoose');

const guildSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    channels: {
        type: [{
            channelId: String,
            language: { type: String, enum: ['vi', 'en'], default: 'vi' }
        }],
        default: []
    },
    premium: { type: Boolean, default: false },
    recordChain: { type: Number, default: 0 },
    recordHolders: { type: String, default: 'Chưa có' }
});

module.exports = mongoose.model('Guild', guildSchema);
