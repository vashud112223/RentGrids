const express = require("express");
const { sendMessage, getMessages } = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

const messageRouter = express.Router();
messageRouter.post("/api/message", authMiddleware, sendMessage);
messageRouter.get("/api/message/:chatId", authMiddleware, getMessages);

module.exports = messageRouter;
