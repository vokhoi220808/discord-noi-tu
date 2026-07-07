const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType, MessageFlags } = require('discord.js');
const SoloMatch = require('../models/SoloMatch');
const SoloEngine = require('../services/SoloEngine');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('solo')
        .setDescription('Thách đấu nối từ 1vs1 (PvP hoặc PvE)')
        .addUserOption(option => 
            option.setName('opponent')
                .setDescription('Người bạn muốn thách đấu (Bỏ trống để đấu với Bot)')
                .setRequired(false)
        ),

    async execute(interaction) {
        const opponent = interaction.options.getUser('opponent');
        const channelId = interaction.channelId;
        const guildId = interaction.guildId;
        const player1 = interaction.user;

        // Check if a match is already active in this channel
        const existingMatch = await SoloMatch.findOne({ channelId });
        if (existingMatch) {
            return await interaction.reply({
                content: 'Kênh này đang có một trận đấu Solo diễn ra hoặc đang chờ phản hồi. Hãy chọn kênh khác hoặc đợi kết thúc!',
                flags: [MessageFlags.Ephemeral]
            });
        }

        // PVE (Vs Bot)
        if (!opponent || opponent.bot) {
            await SoloMatch.create({
                channelId,
                guildId,
                player1: player1.id,
                player2: null,
                status: 'playing',
                timeLimit: 30, // Default PVE time is 30s
                turn: player1.id
            });

            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('⚔️ THÁCH ĐẤU SOLO VỚI BOT ⚔️')
                .setDescription(`Trận đấu giữa <@${player1.id}> và **Độ Mixi** chính thức bắt đầu!\n\n⏳ **Thời gian suy nghĩ:** 30 giây/lượt\n\n🎯 **Lượt đầu tiên:** <@${player1.id}> hãy nhập một từ ghép 2 tiếng bất kỳ để bắt đầu!`);

            const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
            SoloEngine.startTurnTimer(channelId, player1.id, 30, interaction.client);
            return;
        }

        // PVP (Vs Player)
        if (opponent.id === player1.id) {
            return await interaction.reply({ content: 'Bạn không thể tự thách đấu chính mình!', flags: [MessageFlags.Ephemeral] });
        }

        let timeLimit = 30; // Default PVP time

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('⚔️ LỜI MỜI THÁCH ĐẤU NỐI TỪ ⚔️')
            .setDescription(`Này <@${opponent.id}>! Bạn vừa nhận được lời thách đấu từ <@${player1.id}>.\n\n⏳ **Thời gian suy nghĩ mặc định:** ${timeLimit} giây/lượt\n\nBạn có 5 phút để chấp nhận lời mời này!`)
            .setThumbnail(player1.displayAvatarURL());

        const acceptBtn = new ButtonBuilder()
            .setCustomId('solo_accept')
            .setLabel('Chấp nhận')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const declineBtn = new ButtonBuilder()
            .setCustomId('solo_decline')
            .setLabel('Từ chối')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌');

        const timeSelect = new StringSelectMenuBuilder()
            .setCustomId('solo_time_select')
            .setPlaceholder('⚙️ Cài đặt thời gian (Chỉ người mời)')
            .addOptions([
                { label: 'Siêu tốc (10s)', value: '10' },
                { label: 'Nhanh (15s)', value: '15' },
                { label: 'Bình thường (30s)', value: '30' },
                { label: 'Lâu (1 phút)', value: '60' },
                { label: 'Không giới hạn', value: '0' },
            ]);

        const row1 = new ActionRowBuilder().addComponents(acceptBtn, declineBtn);
        const row2 = new ActionRowBuilder().addComponents(timeSelect);

        const response = await interaction.reply({ 
            content: `<@${opponent.id}>`,
            embeds: [embed], 
            components: [row1, row2], 
            fetchReply: true 
        });

        const match = await SoloMatch.create({
            channelId,
            guildId,
            player1: player1.id,
            player2: opponent.id,
            status: 'waiting',
            timeLimit: timeLimit,
            messageId: response.id
        });

        // Setup Collector for 5 minutes
        const collector = response.createMessageComponentCollector({ time: 5 * 60 * 1000 });

        collector.on('collect', async i => {
            if (i.customId === 'solo_time_select') {
                if (i.user.id !== player1.id) {
                    return await i.reply({ content: 'Chỉ người mời mới có quyền đổi thời gian!', flags: [MessageFlags.Ephemeral] });
                }
                timeLimit = parseInt(i.values[0]);
                await SoloMatch.updateOne({ channelId }, { timeLimit });
                
                const newDesc = `Này <@${opponent.id}>! Bạn vừa nhận được lời thách đấu từ <@${player1.id}>.\n\n⏳ **Thời gian suy nghĩ:** ${timeLimit === 0 ? 'Không giới hạn' : timeLimit + ' giây/lượt'}\n\nBạn có 5 phút để chấp nhận lời mời này!`;
                embed.setDescription(newDesc);
                await i.update({ embeds: [embed] });
            }

            if (i.customId === 'solo_accept') {
                if (i.user.id !== opponent.id) {
                    return await i.reply({ content: 'Bạn không phải là người được mời!', flags: [MessageFlags.Ephemeral] });
                }
                
                await SoloMatch.updateOne({ channelId }, { status: 'playing', turn: opponent.id });
                
                embed.setColor('#00FF00')
                    .setTitle('⚔️ TRẬN ĐẤU BẮT ĐẦU ⚔️')
                    .setDescription(`Trận Solo giữa <@${player1.id}> và <@${opponent.id}> chính thức bắt đầu!\n\n⏳ **Thời gian:** ${timeLimit === 0 ? 'Không giới hạn' : timeLimit + ' giây/lượt'}\n\n🎯 **Lượt đầu tiên:** <@${opponent.id}> hãy nhập một từ ghép 2 tiếng bất kỳ để khai cuộc!`);
                
                await i.update({ content: null, embeds: [embed], components: [] });
                collector.stop('accepted');
                
                if (timeLimit > 0) {
                    SoloEngine.startTurnTimer(channelId, opponent.id, timeLimit, interaction.client);
                }
            }

            if (i.customId === 'solo_decline') {
                if (i.user.id !== opponent.id && i.user.id !== player1.id) {
                    return await i.reply({ content: 'Bạn không có quyền này!', flags: [MessageFlags.Ephemeral] });
                }
                await SoloMatch.deleteOne({ channelId });
                embed.setColor('#808080')
                    .setTitle('Thách đấu đã bị hủy')
                    .setDescription(`<@${i.user.id}> đã từ chối/hủy lời thách đấu.`);
                await i.update({ content: null, embeds: [embed], components: [] });
                collector.stop('declined');
            }
        });

        collector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await SoloMatch.deleteOne({ channelId });
                embed.setColor('#808080')
                    .setTitle('Thách đấu hết hạn')
                    .setDescription(`Lời thách đấu đã hết hạn vì không được phản hồi.`);
                await interaction.editReply({ content: null, embeds: [embed], components: [] }).catch(() => {});
            }
        });
    }
};
