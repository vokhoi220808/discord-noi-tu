const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../models/Player');

const embedData = async (guildId) => {
    const players = await Player.find({ guildId });
    
    const rankOfServer = players.sort((a, b) => {
        if (b.win !== a.win) return b.win - a.win;
        const aAccuracy = a.total === 0 ? 0 : a.true / a.total;
        const bAccuracy = b.total === 0 ? 0 : b.true / b.total;
        if (bAccuracy !== aAccuracy) return bAccuracy - aAccuracy;
        return b.true - a.true;
    });

    let embedd = [
        { name: 'Top 10', value: '', inline: true },
        { name: 'Win', value: '', inline: true },
        { name: 'Từ đúng', value: '', inline: true }
    ];

    if (rankOfServer.length === 0) {
        return [{ name: 'Top 10', value: 'Chưa có ai chơi nối từ ở server này.' }];
    } else {
        for (let i = 0; i < rankOfServer.length; i++) {
            const player = rankOfServer[i];
            const trueCount = player.true || 0;
            const totalCount = player.total || 0;
            const percentage = totalCount > 0 ? (trueCount / totalCount * 100).toFixed(2) : 0;
            
            embedd[0].value += ('`' + (i + 1) + '` ' + player.name + '\n');
            embedd[1].value += ('`' + player.win + '`\n');
            embedd[2].value += ('`' + trueCount + '/' + totalCount + ' (' + percentage + '%)`\n');
            if (i == 9) break;
        }
        return embedd;
    }
};

const rankEmbed = async (interaction) => {
    const fields = await embedData(interaction.member.guild.id);
    return new EmbedBuilder()
        .setColor(13250094)
        .setAuthor({
            name: `BXH nối từ của ${interaction.member.guild.name}`,
            iconURL: interaction.member.guild.iconURL({ dynamic: true })
        })
        .addFields(fields);
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Xem bảng xếp hạng nối từ'),

    async execute(interaction, client) {
        await interaction.deferReply();
        const embed = await rankEmbed(interaction);
        await interaction.editReply({ embeds: [embed] });
    }
};