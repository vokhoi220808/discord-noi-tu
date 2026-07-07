const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Player = require('../models/Player');

const scrambleWord = (word) => {
    // Remove spaces, convert to uppercase array, shuffle
    const letters = word.replace(/\s+/g, '').toUpperCase().split('');
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    return letters.join(' - ');
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gheptu')
        .setDescription('Minigame: Sắp xếp lại các chữ cái bị đảo lộn để tìm ra từ gốc!'),

    async execute(interaction) {
        if (!global.dicData || global.dicData.length === 0) {
            return await interaction.reply({ content: '❌ Từ điển chưa tải xong, vui lòng đợi!', ephemeral: true });
        }

        // Chọn 1 từ ngẫu nhiên có độ dài vừa phải
        let targetWord = '';
        while (targetWord.length < 5 || targetWord.length > 9) {
            targetWord = global.dicData[Math.floor(Math.random() * global.dicData.length)];
        }
        
        const scrambled = scrambleWord(targetWord);

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle('🧩 MINIGAME: GHÉP TỪ')
            .setDescription(`Hãy sắp xếp lại các chữ cái sau để tạo thành 1 từ có nghĩa (Viết hoa thường, có dấu đầy đủ):\n\n**${scrambled}**\n\n*(Bạn có 60 giây để trả lời)*`);

        await interaction.reply({ embeds: [embed] });

        const filter = m => !m.author.bot;
        const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });
        const participated = new Set();

        collector.on('collect', async m => {
            const guildId = m.guild.id;
            const userId = m.author.id;
            
            // Mark as participated for stats
            if (!participated.has(userId)) {
                participated.add(userId);
                await Player.updateOne(
                    { guildId, userId },
                    { 
                        $inc: { miniTotal: 1 },
                        $setOnInsert: { name: m.author.displayName, avatar: m.author.displayAvatarURL() }
                    },
                    { upsert: true }
                );
            }

            if (m.content.trim().toLowerCase() === targetWord.toLowerCase()) {
                collector.stop('winner');
                
                await Player.updateOne({ guildId, userId }, { $inc: { miniWin: 1 } });

                const winEmbed = new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle('🎉 CÓ NGƯỜI GIẢI ĐƯỢC RỒI!')
                    .setDescription(`Chúc mừng <@${userId}> đã đoán chính xác từ: **${targetWord.toUpperCase()}**!`);
                await interaction.channel.send({ embeds: [winEmbed] });
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason !== 'winner') {
                const loseEmbed = new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle('⏳ HẾT GIỜ!')
                    .setDescription(`Rất tiếc không ai giải được! Đáp án chính xác là: **${targetWord.toUpperCase()}**`);
                interaction.channel.send({ embeds: [loseEmbed] });
            }
        });
    }
};
