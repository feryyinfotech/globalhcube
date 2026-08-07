const { Server } = require("socket.io");

let io;

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust this to your frontend's origin
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    // console.log("A user connected:", socket.id);
    socket.emit("socketId", socket.id);
    socket.on("disconnect", () => {
      // console.log("A user disconnected:", socket.id);
    });
  });

  return io;
}

function getSocketIO() {
  if (!io) {
    throw new Error(
      "Socket.io is not initialized. Call initializeSocket first."
    );
  }
  return io;
}

module.exports = { initializeSocket, getSocketIO };
