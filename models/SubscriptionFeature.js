const mongoose = require("mongoose");

const SubscriptionFeatureSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    description: {
      type: String,
      default: ""
    },
    isPremium: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SubscriptionFeature", SubscriptionFeatureSchema);
