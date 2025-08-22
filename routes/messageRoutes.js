const express = require("express");
const { sendMessage, getMessages, deleteMessage, sendPhoto, sendLocation } = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

const messageRouter = express.Router();
messageRouter.post("/api/message", authMiddleware, sendMessage);
messageRouter.get("/api/message/:chatId", authMiddleware, getMessages);
messageRouter.delete("/api/message/:messageId", authMiddleware, deleteMessage);
messageRouter.post("/api/message/photo", authMiddleware, upload.single("image"), sendPhoto);
messageRouter.post("/api/message/location", authMiddleware, sendLocation);

module.exports = messageRouter;
