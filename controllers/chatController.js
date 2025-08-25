const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");

exports.accessChat = async (req, res) => {
  const { userId } = req.body;

  let chat = await Chat.findOne({
    isGroupChat: false,
    users: { $all: [req.userId, userId] },
  })
    .populate("users", "-password")
    .populate("latestMessage");

  if (!chat) {
    chat = await Chat.create({
      users: [req.userId, userId],
      isGroupChat: false,
    });
  }

  res.json(chat);
};

exports.fetchChats = async (req, res) => {
  const chats = await Chat.find({
    users: { $elemMatch: { $eq: req.userId } },
  })
    .populate("users", "-password")
    .populate("latestMessage")
    .sort({ updatedAt: -1 });

  res.json(chats);
};

exports.createGroupChat = async (req, res) => {
  const { users, name } = req.body;
  if (!users || !name)
    return res.status(400).json({ message: "All fields required" });

  const groupChat = await Chat.create({
    chatName: name,
    users: [...users, req.userId],
    isGroupChat: true,
    groupAdmin: req.userId,
  });

  res.json(groupChat);
};

// Search chats by name or user email/name
exports.searchChats = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }

    // Find all chats where current user is a participant
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.userId } },
    })
      .populate("users", "-password")
      .populate("latestMessage")
      .sort({ updatedAt: -1 });

    const regex = new RegExp(query, "i"); // case-insensitive

    const filteredChats = chats.filter((chat) => {
      if (chat.isGroupChat) {
        return regex.test(chat.chatName || "");
      }

      // Pick the other user
      const otherUser = chat.users.find(
        (u) => u._id.toString() !== req.userId.toString()
      );
      if (!otherUser) return false;

      // Match fullName, emailId, or phonenumber
      return (
        regex.test(otherUser.fullName || "") ||
        regex.test(otherUser.emailId || "") ||
        regex.test(otherUser.phonenumber || "")
      );
    });

    res.json(filteredChats);
  } catch (error) {
    console.error("Search Chats Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

// delete the chat
exports.deleteChat = async (req, res) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    // Only members of the chat can delete it
    if (!chat.users.includes(req.userId)) {
      return res.status(403).json({ message: "Not authorized to delete this chat" });
    }

    // Delete all messages of this chat
    await Message.deleteMany({ chat: chatId });

    // Delete chat itself
    await Chat.findByIdAndDelete(chatId);

    res.json({ message: "Chat and its messages deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
