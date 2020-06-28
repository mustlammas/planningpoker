const http = require('http');
const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const config = require('../webpack.config.js');
const WebSocket = require('ws');

const app = express();
const port = 3000;
const devServerEnabled = true;
const clients = [];

if (devServerEnabled) {
    //reload=true:Enable auto reloading when changing JS files or content
    //timeout=1000:Time from disconnecting from server to reconnecting
    config.entry.app.unshift('webpack-hot-middleware/client?reload=true&timeout=1000');

    //Add HMR plugin
    config.plugins.push(new webpack.HotModuleReplacementPlugin());

    const compiler = webpack(config);

    //Enable "webpack-dev-middleware"
    app.use(webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath
    }));

    //Enable "webpack-hot-middleware"
    app.use(webpackHotMiddleware(compiler));
}

app.use(express.static(__dirname + '/../public'));

const server = http.createServer(app);

const wss = new WebSocket.Server({ server: server, path: '/chat' });

const broadcast = (message) => {
  clients.forEach((c) => {
    c.send(message);
  });
};

wss.on('connection', function connection(ws, req) {
  clients.push(ws);
  //clients[req.connection.remoteAddress] = ws;
  ws.on('message', function incoming(message) {
    console.log("Message: ", message);
    broadcast(message);
  });
  ws.on('close', function(reasonCode, description) {
    console.log('Client ' + connection.remoteAddress + ' disconnected.');
    // TODO: remove the client
  });
});

server.listen(port, () => {
    console.log('Server started on port ' + port);
});
