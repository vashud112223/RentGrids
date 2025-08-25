const mongoose = require("mongoose");

const PreferredTenantSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",   // reference to owner
      required: true
    },
    propertyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Property",   // reference to property
      required: true
    },
    tenantTypes: [
      {
        type: String,
        enum: ["Family", "Bachelors", "Anyone", "Working Professionals", "Students"],
        required: true
      }
    ],
    notes: {
      type: String, // optional remarks by owner (e.g. "Prefer IT employees", etc.)
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PreferredTenant", PreferredTenantSchema);
