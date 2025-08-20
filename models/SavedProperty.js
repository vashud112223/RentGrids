// models/SavedProperty.js
const mongoose = require("mongoose");
const savedPropertySchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true,
    },
    savedAt: { type: Date, default: Date.now },
  },
  { indexes: [{ tenantId: 1, propertyId: 1, unique: true }] }
);
module.exports = mongoose.model("SavedProperty", savedPropertySchema);
