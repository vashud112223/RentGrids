const express = require("express");
const { accessChat, fetchChats, createGroupChat, searchChats, deleteChat } = require("../controllers/chatController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { getChatsWithUnread, markAsRead } = require("../controllers/messageController");
const router = express.Router();

const chatRouter = express.Router();
chatRouter.post("/api/chat/access", authMiddleware, accessChat);
chatRouter.get("/api/chat", authMiddleware, fetchChats);
chatRouter.post("/api/chat/group", authMiddleware, createGroupChat);
chatRouter.get("/api/chat/search", authMiddleware, searchChats);
chatRouter.get("/api/chat/unread", authMiddleware, getChatsWithUnread);
chatRouter.put("/api/chat/:chatId/read", authMiddleware, markAsRead);
chatRouter.delete("/chats/:chatId", authMiddleware, deleteChat);
module.exports = chatRouter;
