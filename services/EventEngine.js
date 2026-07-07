const { EmbedBuilder } = require('discord.js');

const EVENTS = [
    {
        id: 'BAN_LETTER',
        name: '🌪️ Bão Tố',
        description: (data) => `Luật mới: 3 lượt tiếp theo KHÔNG ĐƯỢC dùng từ có chứa chữ cái **"${data}"**!`
    },
    {
        id: 'BONUS_LETTER',
        name: '💰 Kho Báu',
        description: (data) => `Ai nối được từ bắt đầu bằng chữ **"${data}"** trong 3 lượt tới sẽ được **x5 Điểm**!`
    },
    {
        id: 'LAST_LETTER',
        name: '🔄 Lật Kèo',
        description: (data) => `Trong 3 lượt tới, hãy nối từ bằng **CHỮ CÁI CUỐI CÙNG** của từ trước đó (Thay vì tiếng cuối cùng)!`
    }
];

const getRandomLetter = () => {
    // Các chữ cái phổ biến trong tiếng Việt (Không dấu)
    const letters = 'ABCDEGHKLMNOPQRSTUVXY'; 
    return letters[Math.floor(Math.random() * letters.length)];
};

const triggerRandomEvent = (activeGame, channelId, client) => {
    // 10% chance to trigger an event, and only if no event is active
    if (activeGame.currentEvent || Math.random() > 0.10) return null; 

    const eventTemplate = EVENTS[Math.floor(Math.random() * EVENTS.length)];
    let eventData = '';

    if (eventTemplate.id === 'BAN_LETTER' || eventTemplate.id === 'BONUS_LETTER') {
        eventData = getRandomLetter();
    }

    const eventString = `${eventTemplate.id}:${eventData}`;
    
    const embed = new EmbedBuilder()
        .setColor('#FF4500')
        .setTitle(`${eventTemplate.name}`)
        .setDescription(eventTemplate.description(eventData));

    const chan = client.channels.cache.get(channelId);
    if (chan) {
        chan.send({ embeds: [embed] });
    }

    return eventString;
};

const checkEventRules = (tu, activeGame) => {
    if (!activeGame.currentEvent) return { valid: true };

    const [eventId, eventData] = activeGame.currentEvent.split(':');

    if (eventId === 'BAN_LETTER') {
        const normalized = tu.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        if (normalized.includes(eventData)) {
            return { valid: false, message: `Từ này chứa chữ cái bị cấm: **${eventData}**` };
        }
    }

    return { valid: true };
};

const getBonusMultiplier = (tu, activeGame) => {
    if (!activeGame.currentEvent) return 1;
    const [eventId, eventData] = activeGame.currentEvent.split(':');
    
    if (eventId === 'BONUS_LETTER') {
        const normalized = tu.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        if (normalized.startsWith(eventData)) {
            return 5;
        }
    }
    return 1;
};

module.exports = {
    triggerRandomEvent,
    checkEventRules,
    getBonusMultiplier
};
