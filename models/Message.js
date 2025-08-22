const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    content: { type: String, trim: true },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat" },
    messageType: {
      type: String,
      enum: ["text", "image", "location"],
      default: "text",
    },
    imageUrl: { type: String }, // for image messages
    location: {
      lat: { type: Number },
      lng: { type: Number },
    },
    readBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
