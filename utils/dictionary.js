const fs = require('fs')
const path = require('path')

const reportWordsPath = path.resolve(__dirname, '../data/report-words.txt')

let reportDic = []

try {
    if (fs.existsSync(reportWordsPath)) {
        const reportDicRead = fs.readFileSync(reportWordsPath, 'utf-8')
        reportDic = reportDicRead.toLowerCase().split('\n').filter(Boolean)
    } else {
        fs.writeFileSync(reportWordsPath, '');
    }
} catch (err) {
    console.error(`Error reading file ${reportWordsPath}:`, err)
}

const checkWordIfInDictionary = (word) => {
    return global.dicData && global.dicData.includes(word)
}

const countWordInDictionary = () => {
    return global.dicData ? global.dicData.length - reportDic.length : 0
}

const getReportWords = () => {
    return reportDic
}

const checkWordIfInReportDictionary = (word) => {
    return reportDic.includes(word)
}

const addWordToReportList = (word) => {
    reportDic.push(word)
    fs.writeFileSync(reportWordsPath, reportDic.join('\n'))
}

module.exports = {
    checkWordIfInDictionary,
    countWordInDictionary,
    getReportWords,
    checkWordIfInReportDictionary,
    addWordToReportList
}