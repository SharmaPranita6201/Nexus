const msgFormat = require("./utils/msgFormat.js");
const ChatMsg = require("./models/msgSchema.js");
const usersInRoom = {};

module.exports = function (io) {
  io.on("connection", (socket) => {
    // Handle room join
    socket.on("joinRoom", async ({ username, roomCode, roomName }) => {
      socket.join(roomCode);

      // Add user to room
      if (!usersInRoom[roomCode]) {
        usersInRoom[roomCode] = [];
      }
      if (!usersInRoom[roomCode].includes(username)) {
        usersInRoom[roomCode].push(username);
      }
      io.to(roomCode).emit("updateUserList", usersInRoom[roomCode]);

      // Send all previous messages to the user who joined
      try {
        const messages = await ChatMsg.find({ Code: roomCode }).sort({
          timestamp: 1,
        });
        socket.emit("roomMessages", messages);
      } catch (err) {
        console.error("Error fetching messages:", err);
      }

      // Notify others in the room
      socket.broadcast
        .to(roomCode)
        .emit("notify", msgFormat("System", `${username} has joined the room`));
    });

    // Handle leaving the room
    socket.on("leaveRoom", ({ roomCode, username }) => {
      if (usersInRoom[roomCode]) {
        usersInRoom[roomCode] = usersInRoom[roomCode].filter(
          (name) => name !== username
        );
        io.to(roomCode).emit("updateUserList", usersInRoom[roomCode]);
      }
      socket.broadcast
        .to(roomCode)
        .emit("notify", msgFormat("System", `${username} has left the room`));
      socket.leave(roomCode);
    });

    // Handle chat messages
    socket.on("chatMsg", async ({ msg, username, roomCode }) => {
      io.to(roomCode).emit("chatMsg", msgFormat(username, msg));
      try {
        const newMessage = new ChatMsg({
          code: roomCode,
          username,
          message: msg,
        });
        await newMessage.save();
      } catch (err) {
        console.error("Error saving message:", err);
      }
    });

    // Handle user disconnection
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};
