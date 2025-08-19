module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("⚡ New client connected", socket.id);

    socket.on("setup", (userData) => {
      socket.join(userData._id);
      socket.emit("connected");
    });

    socket.on("join chat", (room) => {
      socket.join(room);
      console.log("User joined room: " + room);
    });

    socket.on("new message", (messageReceived) => {
      let chat = messageReceived.chat;
      if (!chat.users) return;

      chat.users.forEach((user) => {
        if (user._id == messageReceived.sender._id) return;
        socket.in(user._id).emit("message received", messageReceived);
      });
    });

    socket.on("disconnect", () => {
      console.log("🔌 Client disconnected", socket.id);
    });
  });
};
