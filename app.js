const http = require('http');
const fs = require('fs');
const express = require('express');

const hostname = '127.0.0.1';
const port = 3000;
const app = express();

app.use(express.static('public'));
app.get('/', (req, res) => {
    res.send('An alligator approaches!');
});

app.listen(3000, () => console.log('Gator app listening on port 3000!'));
