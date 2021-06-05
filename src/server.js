const http = require('http');
const express = require('express');
const crypto = require("crypto");
const path = require('path');

const port = 2222;
const app = express();
const msg = require("./shared/messages.js");
const {
  v4: uuidv4
} = require('uuid');

app.use(express.static(__dirname + '/../dist'));

const MAX_ROOMS = 20;
const IDLE_ROOM_CHECK_INTERVAL_MINUTES = 60;
const ROOM_MAX_IDLE_TIME_MINUTES = 120;
const rooms = {};

const createRoom = () => {
  const id = crypto.randomBytes(5).toString('hex');
  console.log("New room: ", id);
  rooms[id] = {
    id: id,
    name: `Room ${id}`,
    template: FIBONACCI,
    templates: [
        FIBONACCI,
        T_SHIRT,
        SIMPLE
    ],
    lastInteraction: Date.now()
  };
  return id;
};

app.get('/api/room/new', (req, res) => {
  if (Object.values(rooms).length >= MAX_ROOMS) {
    res.status(503);
    res.send(JSON.stringify({
      error: 503,
      message: "Maximum number of rooms exceeded"
    }));
  } else {
    const roomId = createRoom();
    res.status(201);
    res.redirect(`/api/room/${roomId}`);
  }
});

const touch = (room) => {
  if (rooms[room]) {
    rooms[room].lastInteraction = Date.now();
  }
};

app.get('/api/room/:roomId', (req, res) => {
  const id = req.params.roomId;
  const room = rooms[id];
  if (room) {
    res.json(room);
  } else {
    console.log("Unknown room: ", req.url);
    res.sendFile(path.resolve('dist/index.html'));
  }
});

app.get('*', function(req, res) {
  console.log("Unhandled request: ", req.url);
  res.sendFile(path.resolve('dist/index.html'));
});

const server = http.createServer(app);

const options = {
  cors: {
    origin: "http://localhost:8080",
    methods: ["GET, POST, PUT, DELETE, PATCH, OPTIONS"]
  }
};

const io = require('socket.io')(server, options);

const ensuringUniqueUsername = (room, username, socket, onSuccess) => {
  io.of("/").in(room).fetchSockets().then(sockets => {
    const usernameExists = sockets.map(s => s.username).includes(username);
    if (usernameExists) {
      sendError(socket, `Username ${username} already taken.`);
    } else {
      onSuccess();
    }
  });
};

io.on('connect', (socket) => {
  console.log('Client ' + socket.id + ' connected');

  socket.on(msg.JOIN, message => {
    let m = JSON.parse(message);
    let username = m.username;
    let room = m.room;
    let existingRoom = rooms[room];
    if (existingRoom) {
      ensuringUniqueUsername(room, username, socket, () => {
        socket.join(room);
        console.log(`User ${username} joined room ${room}`);
        socket.username = username;
        sendMessage(socket, msg.USERNAME_OK, {
          username: username
        });
        sendUserList(room);
        sendConfig(room);
        touch(room);
      });
    } else {
      sendError(socket, `Room ${room} does not exist.`);
    }
  });
  socket.on(msg.VOTE, message => {
    const m = JSON.parse(message);
    const room = [...socket.rooms][1];
    socket.vote = m.vote;
    sendUserList(room);
    touch(room);
  });
  socket.on(msg.RESET_VOTE, message => {
    const m = JSON.parse(message);
    const room = [...socket.rooms][1];
    resetVotes(room);
    touch(room);
  });
  socket.on(msg.BECOME_OBSERVER, message => {
    socket.observer = true;
    delete socket.vote;
    const room = [...socket.rooms][1];
    sendUserList(room);
    touch(room);
  });
  socket.on(msg.BECOME_PARTICIPANT, message => {
    delete socket.observer;
    const room = [...socket.rooms][1];
    sendUserList(room);
    touch(room);
  });
  socket.on(msg.REVEAL_VOTES, message => {
    const room = [...socket.rooms][1];
    revealVotes(room);
    sendUserList(room);
    touch(room);
  });
  socket.on(msg.UPDATE_CONFIG, message => {
    const room = [...socket.rooms][1];
    const template = JSON.parse(message);
    const templates = rooms[room].templates;

    if (template.name === "Custom" && !templates.find(t => t.name === "Custom")) {
      rooms[room].templates = [...rooms[room].templates, template];
    }
    rooms[room].template = template;
    sendConfig(room);
    resetVotes(room);
    touch(room);
  });
  socket.on('disconnect', () => {
    console.log('Client ' + socket.id + ' disconnected');
    if ([...socket.rooms].length < 2) {
      return;
    }
    const room = [...socket.rooms][1];
    sendUserList(socket, room);
  });
});

const sendError = (socket, message) => {
  socket.emit(msg.ERROR, JSON.stringify({
    error: message
  }));
};

const sendMessage = (socket, type, msg) => {
  let message = msg && JSON.stringify(msg);
  socket.emit(type, message);
};

const revealVotes = (room) => {
  io.of("/").in(room).fetchSockets().then(sockets => {
    sockets.forEach(s => {
      s.vote = s.vote || "?";
    });
  });
};

const sendUserList = (room) => {
  io.of("/").in(room).fetchSockets().then(sockets => {
    const votes = sockets.map(s => {
      return {
        username: s.username,
        vote: s.vote,
        observer: s.observer
      };
    });
    io.in(room).emit(msg.UPDATE_USERS, JSON.stringify(votes));
  });
};

const resetVotes = (room) => {
  io.of("/").in(room).fetchSockets().then(sockets => {
    sockets.forEach(s => {
      delete s.vote;
    });
    sendUserList(room);
    io.in(room).emit(msg.RESET_VOTE);
  });
};

const sendConfig = (room) => {
  console.log("Sending config: ", rooms[room]);
  io.in(room).emit(msg.CONFIG, JSON.stringify(rooms[room]));
};

server.listen(port, () => {
  console.log('Server started on port ' + port);
});

const removeRoom = (room) => {
  console.log(`Removing idle room '${room}'`);
  io.in(room).emit(msg.ROOM_REMOVED);
  io.of("/").in(room).fetchSockets().then(sockets => {
    sockets.forEach(s => s.disconnect());
  });
  delete rooms[room];
};

const removeIdleRooms = () => {
  const date = Date.now() - (ROOM_MAX_IDLE_TIME_MINUTES * 60 * 1000);
  const allRooms = Object.values(rooms);
  const roomCount = allRooms.length;
  const idleRooms = allRooms.filter(room => room.lastInteraction < date);
  const idleRoomCount = idleRooms.length;
  console.log(`Number of rooms: ${roomCount} / ${idleRoomCount} (idle)`);
  idleRooms.forEach(room => removeRoom(room.id));
};

setInterval(function() {
  removeIdleRooms();
}, IDLE_ROOM_CHECK_INTERVAL_MINUTES * 60 * 1000);

const FIBONACCI = {
  name: "Fibonacci",
  options: [
    {
      text: "1",
      conflicting: ["3", "5", "8", "13", "20", "50"]
    },
    {
      text: "2",
      conflicting: ["5", "8", "13", "20", "50"]
    },
    {
      text: "3",
      conflicting: ["1", "8", "13", "20", "50"]
    },
    {
      text: "5",
      conflicting: ["1", "2", "13", "20", "50"]
    },
    {
      text: "8",
      conflicting: ["1", "2", "3", "20", "50"]
    },
    {
      text: "13",
      conflicting: ["1", "2", "3", "5", "50"]
    },
    {
      text: "20",
      conflicting: ["1", "2", "3", "5", "8"]
    },
    {
      text: "50",
      conflicting: ["1", "2", "3", "5", "8", "13"]
    },
    {
      text: "?",
      conflicting: []
    }
  ]
};

const T_SHIRT = {
  name: "T-Shirt",
  options: [
    {
      text: "XS",
      conflicting: ["M", "L", "XL"]
    },
    {
      text: "S",
      conflicting: ["L", "XL"]
    },
    {
      text: "M",
      conflicting: ["XS", "XL"]
    },
    {
      text: "L",
      conflicting: ["XS", "S"]
    },
    {
      text: "XL",
      conflicting: ["XS", "S", "M"]
    },
    {
      text: "?",
      conflicting: []
    }
  ]
};

const SIMPLE = {
  name: "Simple",
  options: [
    {
      text: "SMALL",
      conflicting: ["LARGE"]
    },
    {
      text: "MEDIUM",
      conflicting: []
    },
    {
      text: "LARGE",
      conflicting: ["SMALL"]
    },
    {
      text: "?",
      conflicting: []
    }
  ]
};