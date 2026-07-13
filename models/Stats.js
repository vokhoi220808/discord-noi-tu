const mongoose = require('mongoose');

const statsSchema = new mongoose.Schema({
    id: { type: String, default: 'global', unique: true },
    queryCount: { type: Number, default: 0 },
    wordPlayedCount: { type: Number, default: 0 },
    roundPlayedCount: { type: Number, default: 0 }
});

module.exports = mongoose.model('Stats', statsSchema);
