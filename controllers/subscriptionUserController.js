const SubscriptionUser = require("../models/SubscriptionUser");

// 1️⃣ Buy a new subscription (always creates new entry)
exports.buySubscription = async (req, res) => {
  try {
    const { ownerId, userId, subscriptionId, durationInDays } = req.body;

    if (!ownerId && !userId) {
      return res.status(400).json({ message: "Either ownerId or userId is required" });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durationInDays || 30));

    const newSub = await SubscriptionUser.create({
      owner: ownerId || null,
      user: userId || null,
      subscription: subscriptionId,
      startDate,
      endDate,
      isExpired: false,
    });

    res.status(201).json(newSub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 2️⃣ Get all subscriptions (history) for user/owner
exports.getSubscriptionHistory = async (req, res) => {
  try {
    const { ownerId, userId } = req.query;

    let query = {};
    if (ownerId) query.owner = ownerId;
    if (userId) query.user = userId;

    const subs = await SubscriptionUser.find(query)
      .populate("subscription")
      .sort({ startDate: -1 }); // latest first

    res.json(subs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// 3️⃣ Get current active subscription
exports.getActiveSubscription = async (req, res) => {
  try {
    const { ownerId, userId } = req.query;

    let query = { isExpired: false, endDate: { $gte: new Date() } };
    if (ownerId) query.owner = ownerId;
    if (userId) query.user = userId;

    const activeSub = await SubscriptionUser.findOne(query)
      .populate("subscription")
      .sort({ startDate: -1 }); // latest one

    if (!activeSub) return res.status(404).json({ message: "No active subscription" });

    res.json(activeSub);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
