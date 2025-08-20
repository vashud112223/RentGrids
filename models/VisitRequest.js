// models/VisitRequest.js
const mongoose = require("mongoose");
const visitRequestSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  landlordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Landlord",
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Property",
    required: true,
  },

  // requested visit state for the tabs
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected"],
    default: "pending",
  },

  // when scheduled (landlord proposes/locks slot)
  schedule: {
    date: Date,
    note: String,
  },

  // audit
  requestedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});
visitRequestSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});
module.exports = mongoose.model("VisitRequest", visitRequestSchema);
