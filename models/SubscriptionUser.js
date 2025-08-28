const mongoose = require("mongoose");

const subscriptionUserSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Owner",
    required: false,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  subscription: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Subscription",
    required: true,
  },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  isExpired: { type: Boolean, default: false },
});

subscriptionUserSchema.pre("save", function (next) {
  if (!this.owner && !this.user) {
    return next(new Error("Either owner or user must be specified"));
  }
  next();
});

module.exports = mongoose.model("SubscriptionUser", subscriptionUserSchema);
