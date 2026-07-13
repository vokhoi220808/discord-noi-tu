const mongoose = require('mongoose');

const customWordSchema = new mongoose.Schema({
    word: { type: String, required: true, unique: true },
    addedBy: { type: String, required: true }, // User ID of the person who suggested it
    approvedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomWord', customWordSchema);
