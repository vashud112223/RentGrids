// models/Document.js
const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  documentType: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Document", documentSchema);
