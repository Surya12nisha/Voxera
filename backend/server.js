const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*", // lock this later to your frontend URL
    methods: ["GET", "POST"]
  }
});

// username -> socketId
const users = {};

io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  /* =====================
     LOGIN
  ===================== */
  socket.on("login", (username) => {

    // prevent duplicate usernames
    if (users[username]) {
      socket.emit("login-error", "Username already in use");
      return;
    }

    users[username] = socket.id;
    socket.username = username;

    io.emit("online-users", Object.keys(users));
    console.log(`👤 ${username} logged in`);
  });

  /* =====================
     CALL REQUEST
  ===================== */
  socket.on("call-user", ({ from, to }) => {
    if (users[to]) {
      io.to(users[to]).emit("incoming-call", { from });
    }
  });

  /* =====================
     WEBRTC SIGNALING
  ===================== */
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
     END CALL
  ===================== */
  socket.on("end-call", ({ to }) => {
    if (users[to]) {
      io.to(users[to]).emit("call-ended");
    }
  });

  /* =====================
     DISCONNECT
  ===================== */
  socket.on("disconnect", () => {
    if (socket.username) {

      // notify others
      delete users[socket.username];
      io.emit("online-users", Object.keys(users));

      // notify peer if mid-call
      socket.broadcast.emit("call-ended");

      console.log(`🔴 ${socket.username} disconnected`);
    } else {
      console.log("🔴 Socket disconnected:", socket.id);
    }
  });
});

/* =====================
   START SERVER
===================== */
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✅ Voxera signaling server running on port ${PORT}`);
});
