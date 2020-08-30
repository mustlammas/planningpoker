const http = require('http');
const express = require('express');
const WebSocket = require('ws');

const port = 2222;
const app = express();
const devServerEnabled = true;
const clients = {};
const msg = require("./messages.js");
const {
  v4: uuidv4
} = require('uuid');
const state = {
  revealVotes: false
};

app.use(express.static(__dirname + '/../dist'));

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server: server,
  path: '/chat'
});

const broadcast = (message) => {
  Object.values(clients).forEach(c => {
    c.socket.send(message);
  });
};

const sendUserList = (clear) => {
  broadcast(JSON.stringify({
    type: msg.MSG_UPDATE_USERS,
    message: votesWithUsernames(),
    reveal: state.revealVotes
  }));
};

const votesWithUsernames = () => {
  return Object.values(clients).map(c => {
    return {
      username: c.username,
      vote: c.vote,
      observer: c.observer
    };
  });
};

const votes = () => {
  return Object.values(clients).map(c => c.vote);
};

const sendResetVote = () => {
  broadcast(JSON.stringify({
    type: msg.MSG_RESET_VOTE
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
    sendUserList();
  } else if (m.type === msg.MSG_CHAT) {
    broadcast(message);
  } else if (m.type === msg.MSG_VOTE) {
    clients[socket.id] = {
      ...clients[socket.id],
      vote: m.message
    };
    sendUserList();
  } else if (m.type === msg.MSG_RESET_VOTE) {
    state.revealVotes = false;
    Object.values(clients).forEach(c => {
      delete c.vote;
    });
    sendResetVote();
    sendUserList();
  } else if (m.type === msg.MSG_BECOME_OBSERVER) {
    console.log(`${socket.id} observs`);
    clients[socket.id] = {
      ...clients[socket.id],
      observer: true
    };
    sendUserList();
  } else if (m.type === msg.MSG_BECOME_PARTICIPANT) {
    console.log(`${socket.id} participates`);
    clients[socket.id] = {
      ...clients[socket.id],
      observer: false
    };
    sendUserList();
  }
};

wss.on('connection', function connection(socket, req) {
  socket.id = uuidv4();
  socket.on('message', function incoming(message) {
    processMsg(message, socket);
  });
  socket.on('close', function(reasonCode, description) {
    console.log('Client ' + socket.id + ' disconnected.');
    delete clients[socket.id];
    sendUserList();
  });
});

server.listen(port, () => {
  console.log('Server started on port ' + port);
});
