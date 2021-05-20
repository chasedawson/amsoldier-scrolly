const http = require('http');
const express = require('express');
var path = require('path');

const app = new express();
const port = 8080;

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views/story.html'));
});

app.listen(port, () => {
    console.log(`server listening at http://localhost:${port}`);
});

