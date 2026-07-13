const GameEngine = require('../services/GameEngine');
const SoloEngine = require('../services/SoloEngine');
const SoloMatch = require('../models/SoloMatch');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        // Prefix command wrapper
        const PREFIX = '!';
        if (message.content.startsWith(PREFIX)) {
            const args = message.content.slice(PREFIX.length).trim().split(/ +/);
            let commandName = args.shift().toLowerCase();
            
            if (commandName === 'ff') commandName = 'surrender';
            if (commandName === 'inv') commandName = 'inventory';

            const command = client.commands.get(commandName);
            if (command) {
                // Fake interaction object
                const fakeInteraction = {
                    commandName,
                    user: message.author,
                    member: message.member,
                    guild: message.guild,
                    channel: message.channel,
                    guildId: message.guild.id,
                    channelId: message.channel.id,
                    client: client,
                    options: {
                        getUser: (name) => {
                            if (name === 'opponent' || name === 'user') {
                                return message.mentions.users.first() || null;
                            }
                            return null;
                        },
                        getString: (name) => {
                            if (name === 'language') {
                                const langArg = args.find(arg => ['vi', 'en'].includes(arg.toLowerCase()));
                                return langArg ? langArg.toLowerCase() : null;
                            }
                            return args.join(' ');
                        },
                        getInteger: (name) => {
                            if (name === 'amount') {
                                const num = parseInt(args[args.length - 1]);
                                return isNaN(num) ? 0 : num;
                            }
                            return 0;
                        },
                        getChannel: (name) => {
                            return message.mentions.channels.first() || message.channel;
                        }
                    },
                    reply: async (data) => message.reply(data),
                    editReply: async (data) => message.reply(data),
                    deferReply: async () => {}
                };

                try {
                    await command.execute(fakeInteraction);
                } catch (e) {
                    console.error('Prefix command error:', e);
                }
                return;
            }
        }

        try {
            const activeSoloMatch = await SoloMatch.findOne({ channelId: message.channel.id, status: 'playing' });
            if (activeSoloMatch) {
                await SoloEngine.handleMessage(message, activeSoloMatch, client);
            } else {
                await GameEngine.handleMessage(message, client);
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }
};
