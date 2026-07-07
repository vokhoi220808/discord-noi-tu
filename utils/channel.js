const Guild = require('../models/Guild');

const setChannel = async (guildId, channelId) => {
    await Guild.findOneAndUpdate(
        { guildId },
        { channelId },
        { upsert: true, returnDocument: 'after' }
    );
};

const getChannel = async (guildId) => {
    const guild = await Guild.findOne({ guildId });
    return guild ? guild.channelId : null;
};

module.exports = {
    setChannel,
    getChannel
};