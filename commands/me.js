const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const Player = require('../models/Player');
const { generateProfileCard } = require('../utils/canvasProfile');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('me')
        .setDescription('Xem hồ sơ thẻ ảnh nối từ của bạn hoặc người khác')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('Người bạn muốn xem hồ sơ')
                .setRequired(false)
        ),

    async execute(interaction, client) {
        await interaction.deferReply();
        
        let targetUser = interaction.user || interaction.member?.user;
        if (interaction.options && typeof interaction.options.getUser === 'function') {
            const mentioned = await Promise.resolve(interaction.options.getUser('user'));
            if (mentioned) targetUser = mentioned;
        }

        const guildId = interaction.guildId || interaction.guild?.id;
        
        let dataUser = await Player.findOne({ userId: targetUser.id, guildId });
        if (!dataUser) {
            dataUser = { true: 0, total: 0, win: 0, enTrue: 0, pvpWin: 0, pvpLoss: 0, enPvpWin: 0, pvpWinStreak: 0, enPvpWinStreak: 0, miniWin: 0, miniTotal: 0, coins: 0 };
        }

        const viRank = await Player.countDocuments({ guildId, true: { $gt: dataUser.true || 0 } }) + 1;
        const pvpRank = await Player.countDocuments({ guildId, pvpWin: { $gt: dataUser.pvpWin || 0 } }) + 1;
        const enRank = await Player.countDocuments({ guildId, enTrue: { $gt: dataUser.enTrue || 0 } }) + 1;
        const enPvpRank = await Player.countDocuments({ guildId, enPvpWin: { $gt: dataUser.enPvpWin || 0 } }) + 1;
        const miniWin = dataUser.miniWin || 0;
        const miniRank = await Player.countDocuments({ guildId, miniWin: { $gt: miniWin } }) + 1;

        const rankData = { viRank, pvpRank, enRank, enPvpRank, miniRank };

        try {
            const buffer = await generateProfileCard(targetUser, dataUser, rankData);
            const attachment = new AttachmentBuilder(buffer, { name: 'profile.png' });

            const embed = new EmbedBuilder()
                .setColor(0x0099FF)
                .setImage('attachment://profile.png')
                .setTimestamp();

            await interaction.editReply({ embeds: [embed], files: [attachment] });
        } catch (e) {
            console.error('Canvas error:', e);
            await interaction.editReply({ content: '❌ Đã có lỗi xảy ra khi tạo thẻ ảnh Hồ Sơ.' });
        }
    }
};