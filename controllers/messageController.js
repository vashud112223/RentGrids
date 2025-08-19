const Message = require("../models/Message");
const Chat = require("../models/Chat");

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  let message = await Message.create({
    sender: req.userId,
    content,
    chat: chatId,
  });

  message = await message.populate("sender", "name email");
  message = await message.populate("chat");
  await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

  res.json(message);
};

exports.getMessages = async (req, res) => {
  const messages = await Message.find({ chat: req.params.chatId })
    .populate("sender", "name email")
    .populate("chat");

  res.json(messages);
};

exports.markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      { chat: chatId, readBy: { $ne: req.userId } },
      { $push: { readBy: req.userId } }
    );

    res.json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChatsWithUnread = async (req, res) => {
  try {
    const chats = await Chat.find({ users: req.userId })
      .populate("latestMessage")
      .populate("users", "name email");

    // Add unread count
    const chatsWithUnread = await Promise.all(
      chats.map(async (chat) => {
        const unreadCount = await Message.countDocuments({
          chat: chat._id,
          sender: { $ne: req.userId },
          readBy: { $ne: req.userId }
        });

        return { ...chat.toObject(), unreadCount };
      })
    );

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
