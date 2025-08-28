const mongoose = require("mongoose");

const SubscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    price: {
      type: Number,
      required: true
    },
    duration: {
      type: Number, // in days
      required: true
    },
    visitCredits: {
      type: Number,
      required: true
    },
    features: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubscriptionFeature"  // reference to SubscriptionFeature table
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Subscription", SubscriptionSchema);
