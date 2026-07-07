const fs = require('fs');
const path = require('path');
const axios = require('axios');

const wordDataUrl = 'https://github.com/undertheseanlp/dictionary/raw/master/dictionary/words.txt';
const wordDatabasePath = path.resolve(__dirname, '../data/words.txt');
const contributeWordsUrl = 'https://github.com/lvdat/phobo-contribute-words/raw/main/accepted-words.txt';
const contributeWordsPath = path.resolve(__dirname, '../data/contribute-words.txt');
const officalWordsPath = path.resolve(__dirname, '../data/official-words.txt');

const loadDictionary = async () => {
    if (!fs.existsSync(path.resolve(__dirname, '../data'))) {
        fs.mkdirSync(path.resolve(__dirname, '../data'));
    }

    if (!fs.existsSync(wordDatabasePath)) {
        console.log('[WARNING] Downloading words database from Github...');
        try {
            const res = await axios.get(wordDataUrl);
            const lines = res.data.trim().split('\n');
            const wordsdb = lines.map(line => JSON.parse(line).text);
            fs.writeFileSync(wordDatabasePath, wordsdb.join('\n'));
            console.log('[OK] Saved words database to ' + wordDatabasePath);
        } catch (err) {
            console.log('[ERROR] Error when download data: ' + err.message);
        }
    }

    console.log('[WARNING] Loading words...');
    const data = fs.readFileSync(wordDatabasePath, 'utf-8');
    const tempWord = data.toLowerCase().split('\n');
    console.log(`[OK] Loaded ${tempWord.length} words. Normalizing...`);
    global.dicData = tempWord.filter(w => w.split(' ').length == 2 && !w.includes('-') && !w.includes('(') && !w.includes(')'));
    console.log(`[OK] Normalized words. ${global.dicData.length} words remaining.`);

    console.log('[WARNING] Downloading contribute words from Github...');
    try {
        const res = await axios.get(contributeWordsUrl);
        const lines = res.data.toLowerCase().trim().split('\n');
        fs.writeFileSync(contributeWordsPath, lines.join('\n'));
        console.log('[OK] Saved ' + lines.length + ' contribute words to ' + contributeWordsPath);
        global.dicData = global.dicData.concat(lines);
        console.log('[WARNING] Bot dictionary now have ' + global.dicData.length + ' words');
        fs.writeFileSync(officalWordsPath, global.dicData.join('\n'));
        console.log('[OK] Saved official words to official-words.txt');
    } catch (err) {
        console.log('[ERROR] Error when download contribute words: ' + err.message);
    }

    console.log('[WARNING] Loading custom words from Database...');
    try {
        const CustomWord = require('../models/CustomWord');
        const customWords = await CustomWord.find({});
        if (customWords.length > 0) {
            const customWordsArray = customWords.map(doc => doc.word);
            global.dicData = global.dicData.concat(customWordsArray);
            console.log(`[OK] Loaded ${customWords.length} custom words from MongoDB.`);
        }
    } catch (err) {
        console.log('[ERROR] Error loading custom words from DB: ' + err.message);
    }
    console.log(`[OK] Final dictionary size: ${global.dicData.length} words`);
};

module.exports = { loadDictionary };
