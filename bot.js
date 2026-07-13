const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection } = require('discord.js');
const mongoose = require('mongoose');
const { loadDictionary } = require('./services/DictionaryLoader');
const keepAlive = require('./keep_alive');
require('dotenv').config();

keepAlive();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Load words
loadDictionary();

// We create a collection for commands
client.commands = new Collection();
const commandFiles = fs
  .readdirSync('./commands')
  .filter((file) => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

// Events
const eventFiles = fs
  .readdirSync('./events')
  .filter((file) => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args, client));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Interaction handling
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;
    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
        console.log(`[${interaction.guild.name}] ${interaction.user.username} used /${interaction.commandName}`);
        await command.execute(interaction, client);
    } catch (error) {
        console.error(error);
        if (interaction.deferred || interaction.replied) {
            return interaction.followUp({ content: "An error occurred while executing this command!", ephemeral: true });
        }
        return interaction.reply({
            content: "An error occurred while executing this command!",
            ephemeral: true,
            fetchReply: true
        });
    }
});

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log('[OK] Connected to MongoDB');
        client.login(process.env.BOT_TOKEN);
    })
    .catch(err => {
        console.log('[ERROR] Cannot connect to MongoDB:', err.message);
    });
