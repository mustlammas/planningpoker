const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const crypto = require("crypto");

const port = 2222;
const app = express();
const devServerEnabled = true;
const clients = {};
const msg = require("./shared/messages.js");
const {
  v4: uuidv4
} = require('uuid');

const defaultOptions = [
  {
    value: 1,
    text: "1"
  },
  {
    value: 2,
    text: "2"
  },
  {
    value: 3,
    text: "3"
  },
  {
    value: 5,
    text: "5"
  },
  {
    value: 8,
    text: "8"
  },
  {
    value: 13,
    text: "13"
  },
  {
    value: 20,
    text: "20"
  },
  {
    value: 50,
    text: "50"
  },
  {
    value: -1,
    text: "?"
  }];

app.use(express.static(__dirname + '/../dist'));

const MAX_ROOMS = 10;
const rooms = {};

const createRoom = () => {
  const id = crypto.randomBytes(10).toString('hex');
  console.log("New room: ", id);
  rooms[id] = {
    id: id,
    name: `Room ${id}`,
    options: defaultOptions
  };
  return id;
};

app.get('/api/new', (req, res) => {
  if (Object.values(rooms).length >= MAX_ROOMS) {
    res.status(503);
    res.send("Maximum number of rooms exceeded.");
  } else {
    const roomId = createRoom();
    res.status(201);
    res.redirect(`/api/${roomId}`);
  }
});

app.get('/api/:roomId', (req, res) => {
  const id = req.params.roomId;
  res.json(rooms[id]);
});

const server = http.createServer(app);

const wss = new WebSocket.Server({
  server: server,
  path: '/ws'
});

const broadcast = (room, message) => {
  socketsForRoom(room).forEach(c => {
    c.socket.send(message);
  });
};

const sendUserList = (room) => {
  broadcast(room, JSON.stringify({
    type: msg.MSG_UPDATE_USERS,
    message: votesWithUsernames(room)
  }));
};

const sendUserExists = (socket) => {
  socket.send(JSON.stringify({
    type: msg.MSG_USER_EXISTS
  }));
};

const socketsForRoom = (room) => {
  return Object.values(clients).filter(c => c.room === room);
};

const votesWithUsernames = (room) => {
  return socketsForRoom(room).map(c => {
    return {
      username: c.username,
      vote: c.vote,
      observer: c.observer,
      connection_broken: c.connection_broken
    };
  });
};

const votes = () => {
  return Object.values(clients).map(c => c.vote);
};

const sendResetVote = (room) => {
  broadcast(room, JSON.stringify({
    type: msg.MSG_RESET_VOTE
  }));
};

const sendUsernameOk = (socket) => {
  socket.send(JSON.stringify({
    type: msg.MSG_USERNAME_OK
  }));
};

const usernames = (room) => votesWithUsernames(room).map(v => v.username);

const sendConfig = (room) => {
  broadcast(room, JSON.stringify({
    type: msg.MSG_CONFIG,
    message: rooms[room]
  }));
};

const processMsg = (message, socket) => {
  let m = JSON.parse(message);

  if (m.type === msg.MSG_CLIENT_CONNECT) {
    let username = m.message.username;
    let room = m.message.room;
    let exists = usernames(room).includes(username);
    if (exists) {
      console.log("Username " + username + " already in use");
      sendUserExists(socket);
    } else {
      console.log(`Client connected: ${username} , room ${room}`);
      clients[socket.id] = {
        socket: socket,
        username: username,
        room: room
      };
      sendUsernameOk(socket);
      sendUserList(room);
      sendConfig(room);
    }
  } else if (m.type === msg.MSG_CHAT) {
    let room = clients[socket.id].room;
    broadcast(room, message);
  } else if (m.type === msg.MSG_VOTE) {
    let room = clients[socket.id].room;
    clients[socket.id] = {
      ...clients[socket.id],
      vote: m.message
    };
    sendUserList(room);
  } else if (m.type === msg.MSG_RESET_VOTE) {
    let room = clients[socket.id].room;
    socketsForRoom(room).forEach(c => {
      delete c.vote;
    });
    sendResetVote(room);
    sendUserList(room);
  } else if (m.type === msg.MSG_BECOME_OBSERVER) {
    let room = clients[socket.id].room;
    console.log(`${socket.id} observes`);
    clients[socket.id] = {
      ...clients[socket.id],
      observer: true
    };
    sendUserList(room);
  } else if (m.type === msg.MSG_BECOME_PARTICIPANT) {
    let room = clients[socket.id].room;
    console.log(`${socket.id} participates`);
    clients[socket.id] = {
      ...clients[socket.id],
      observer: false
    };
    sendUserList(room);
  } else if (m.type === msg.MSG_REVEAL_VOTES) {
    let room = clients[socket.id].room;
    socketsForRoom(room).forEach(c => {
      if (!c.vote) {
        c.vote = "?";
      }
    });
    sendUserList(room);
  } else if (m.type === msg.MSG_UPDATE_CONFIG) {
    let room = clients[socket.id].room;
    console.log("Updated config: ", m.message);
    rooms[room].options = m.message;
    sendConfig(room);
    socketsForRoom(room).forEach(c => {
      delete c.vote;
    });
    sendResetVote(room);
    sendUserList(room);
  }
};

wss.on('connection', function connection(socket, req) {
  socket.id = uuidv4();
  socket.on('message', function incoming(message) {
    processMsg(message, socket);
  });
  socket.on('close', function(reasonCode, description) {
    console.log('Client ' + socket.id + ' disconnected.');
    const room = clients[socket.id].room;
    delete clients[socket.id];
    sendUserList(room);
  });
});

server.listen(port, () => {
  console.log('Server started on port ' + port);
});
