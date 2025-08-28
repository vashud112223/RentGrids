const express = require("express");
const {
  createSubscription,
  getAllSubscriptions,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription
} = require("../controllers/subscriptionController");

const subscriptionRouter = express.Router();

subscriptionRouter.post("/subscriptions", createSubscription);
subscriptionRouter.get("/subscriptions", getAllSubscriptions);
subscriptionRouter.get("/subscriptions/:id", getSubscriptionById);
subscriptionRouter.put("/subscriptions/:id", updateSubscription);
subscriptionRouter.delete("/subscriptions/:id", deleteSubscription);

module.exports = subscriptionRouter;
