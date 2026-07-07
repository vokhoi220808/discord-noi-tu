const Stats = require('../models/Stats');

const getGlobalStats = async () => {
    let stats = await Stats.findOne({ id: 'global' });
    if (!stats) {
        stats = await Stats.create({ id: 'global' });
    }
    return stats;
};

const getQuery = async () => {
    const stats = await getGlobalStats();
    return stats.queryCount;
};

const addQuery = async (query = 1) => {
    await Stats.updateOne({ id: 'global' }, { $inc: { queryCount: query } }, { upsert: true });
};

const getWordPlayedCount = async () => {
    const stats = await getGlobalStats();
    return stats.wordPlayedCount;
};

const addWordPlayedCount = async () => {
    await Stats.updateOne({ id: 'global' }, { $inc: { wordPlayedCount: 1 } }, { upsert: true });
};

const getRoundPlayedCount = async () => {
    const stats = await getGlobalStats();
    return stats.roundPlayedCount;
};

const addRoundPlayedCount = async () => {
    await Stats.updateOne({ id: 'global' }, { $inc: { roundPlayedCount: 1 } }, { upsert: true });
};

module.exports = {
    getQuery,
    addQuery,
    getWordPlayedCount,
    addWordPlayedCount,
    getRoundPlayedCount,
    addRoundPlayedCount
};