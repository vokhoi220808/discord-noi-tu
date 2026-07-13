const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Bot is Alive!');
});

const keepAlive = () => {
    app.listen(port, () => {
        console.log(`[INFO] Keep-alive Web Server is running on port ${port}`);
    });
};

module.exports = keepAlive;
