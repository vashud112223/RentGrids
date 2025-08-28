const express = require("express");
const subscriptionUserrouter = express.Router();
const subUserController = require("../controllers/subscriptionUserController");

// Buy subscription (new entry)
subscriptionUserrouter.post("/buy", subUserController.buySubscription);

// Get full subscription history
subscriptionUserrouter.get("/history", subUserController.getSubscriptionHistory);

// Get current active subscription
subscriptionUserrouter.get("/active", subUserController.getActiveSubscription);

module.exports = subscriptionUserrouter;
