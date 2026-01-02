const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = {}; // username -> socketId

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("login", (username) => {
    users[username] = socket.id;
    io.emit("online-users", Object.keys(users));
  });

  socket.on("call-user", ({ from, to }) => {
    if (users[to]) {
      io.to(users[to]).emit("incoming-call", { from });
    }
  });

  socket.on("webrtc-offer", ({ to, offer }) => {
    if (users[to]) {
      io.to(users[to]).emit("webrtc-offer", offer);
    }
  });

  socket.on("webrtc-answer", ({ to, answer }) => {
    if (users[to]) {
      io.to(users[to]).emit("webrtc-answer", answer);
    }
  });

  socket.on("webrtc-ice-candidate", ({ to, candidate }) => {
    if (users[to]) {
      io.to(users[to]).emit("webrtc-ice-candidate", candidate);
    }
  });

  /* =====================
     🔴 END CALL (NEW)
  ===================== */
  socket.on("end-call", ({ to }) => {
    if (users[to]) {
      io.to(users[to]).emit("call-ended");
    }
  });

  socket.on("disconnect", () => {
    for (let user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        break;
      }
    }
    io.emit("online-users", Object.keys(users));
    console.log("User disconnected:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("✅ Voxera signaling server running on port 3000");
});
