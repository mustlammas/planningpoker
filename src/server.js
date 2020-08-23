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
const clients = {};
const msg = require("./messages.js");

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
  Object.values(clients).forEach(c => {
    c.socket.send(message);
  });
};

const sendUserList = (clients) => {
  let usernames = Object.values(clients).map(c => c.username);
  console.log("Sending user list: ", usernames);
  broadcast(JSON.stringify({
    type: msg.MSG_CLIENT_LIST,
    message: usernames
  }));
};

const processMsg = (message, socket) => {
  let m = JSON.parse(message);
  if (m.type === msg.MSG_CLIENT_CONNECT) {
    let username = m.message;
    console.log(`Client connected: ${username}`);
    clients[socket.id] = {
      socket: socket,
      username: username
    };
    sendUserList(clients);
  } else if (m.type === msg.MSG_CHAT) {
    broadcast(message);
  }
};

wss.on('connection', function connection(socket, req) {
  socket.on('message', function incoming(message) {
    processMsg(message, socket);
  });
  socket.on('close', function(reasonCode, description) {
    console.log('Client ' + connection.remoteAddress + ' disconnected.');
    delete clients[socket.id];
  });
});

server.listen(port, () => {
    console.log('Server started on port ' + port);
});
