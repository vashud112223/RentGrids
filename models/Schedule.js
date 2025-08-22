const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",
      required: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "User" if tenants are stored in user collection
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String, // e.g. "10:30 AM"
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "completed"],
      default: "pending"
    },
    notes: {
      type: String // optional notes from tenant or owner
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", ScheduleSchema);
