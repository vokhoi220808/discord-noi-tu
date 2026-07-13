// https://github.com/Androz2091/discord-sync-commands/
const Discord = require('discord.js')
module.exports = async (client, commands, options = { debug: false, guildId: null }) => {
    const log = (message) => options.debug && console.log(message)
  
    const ready = client.readyAt
      ? await Promise.resolve()
      : new Promise((resolve) => client.once('ready', resolve))
    await ready
  
    log(`Synchronizing commands...`)
    
    try {
        if (options.guildId) {
            await client.application.commands.set(commands, options.guildId);
            log(`Commands synchronized for guild ${options.guildId}!`);
        } else {
            await client.application.commands.set(commands);
            log(`Commands synchronized globally!`);
        }
    } catch (e) {
        console.error('Failed to sync commands:', e);
    }
}