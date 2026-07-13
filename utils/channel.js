const Guild = require('../models/Guild');

const setChannel = async (guildId, channelId, language = 'vi') => {
    let guild = await Guild.findOne({ guildId });
    if (!guild) {
        guild = new Guild({ guildId, channels: [] });
    }
    const index = guild.channels.findIndex(c => c.channelId === channelId);
    if (index >= 0) {
        guild.channels[index].language = language;
    } else {
        guild.channels.push({ channelId, language });
    }
    await guild.save();
};

const getChannelLang = async (guildId, channelId) => {
    const guild = await Guild.findOne({ guildId });
    if (!guild) return null;
    const ch = guild.channels.find(c => c.channelId === channelId);
    return ch ? ch.language : null;
};

module.exports = {
    setChannel,
    getChannelLang
};