const Message = require("../models/Message");
const Chat = require("../models/Chat");
const cloudinary = require("../configuration/cloudinary");
const fs = require("fs");

exports.sendMessage = async (req, res) => {
  const { content, chatId } = req.body;

  let message = await Message.create({
    sender: req.userId,
    content,
    chat: chatId,
    readBy: [req.userId],
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
    // Step 1: Find all chats the user is in
    const chats = await Chat.find({ users: req.userId })
      .populate("latestMessage")
      .populate("users", "fullName emailId")
      .lean(); // lean for performance

    // Step 2: Aggregate unread counts in one go
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          sender: { $ne: req.userId },
          $expr: { $not: { $in: [req.userId, { $ifNull: ["$readBy", []] }] } },
        },
      },
      {
        $group: {
          _id: "$chat",
          count: { $sum: 1 },
        },
      },
    ]);

    // Step 3: Convert aggregation result into a map for quick lookup
    const unreadMap = unreadCounts.reduce((acc, curr) => {
      acc[curr._id.toString()] = curr.count;
      return acc;
    }, {});

    // Step 4: Merge unread counts into chats
    const chatsWithUnread = chats.map((chat) => ({
      ...chat,
      unreadCount: unreadMap[chat._id.toString()] || 0,
    }));

    res.json(chatsWithUnread);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//delete the message
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    // Ensure only sender can delete
    if (message.sender.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(messageId);

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// send images
exports.sendPhoto = async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);

    // Remove local file after upload
    fs.unlinkSync(req.file.path);

    const message = await Message.create({
      sender: req.userId,
      chat: chatId,
      messageType: "image",
      imageUrl: result.secure_url,
      readBy: [req.userId],
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Send location message
exports.sendLocation = async (req, res) => {
  try {
    const { chatId, lat, lng } = req.body;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ message: "Latitude and longitude are required" });
    }

    const message = await Message.create({
      sender: req.userId,
      chat: chatId,
      messageType: "location",
      location: { lat, lng },
      readBy: [req.userId],
    });

    // Update latest message in chat
    await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
