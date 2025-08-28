const Subscription = require("../models/Subscription");

// CREATE Subscription Plan
const createSubscription = async (req, res) => {
  try {
    const { name, price, duration, visitCredits, features } = req.body;

    const subscription = new Subscription({
      name,
      price,
      duration,
      visitCredits,
      features
    });

    await subscription.save();

    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const subscriptions = await Subscription.find()
      .populate("features", "name description isPremium");
    res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const subscription = await Subscription.findById(req.params.id)
      .populate("features", "name description isPremium");
    if (!subscription)
      return res.status(404).json({ success: false, message: "Subscription not found" });

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE subscription
const updateSubscription = async (req, res) => {
  try {
    const { name, price, duration, visitCredits, features } = req.body;

    const subscription = await Subscription.findByIdAndUpdate(
      req.params.id,
      { name, price, duration, visitCredits, features },
      { new: true, runValidators: true }
    );

    if (!subscription)
      return res.status(404).json({ success: false, message: "Subscription not found" });

    res.status(200).json({ success: true, data: subscription });
  } catch (error) {
    console.error("Error updating subscription:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE subscription
const deleteSubscription = async (req, res) => {
  try {
    const subscription = await Subscription.findByIdAndDelete(req.params.id);
    if (!subscription)
      return res.status(404).json({ success: false, message: "Subscription not found" });

    res.status(200).json({ success: true, message: "Subscription deleted successfully" });
  } catch (error) {
    console.error("Error deleting subscription:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription
};
