const express = require("express");
const {
  createFeature,
  getAllFeatures,
  getFeatureById,
  updateFeature,
  deleteFeature
} = require("../controllers/subscriptionFeatureController");

const subscriptionfeatureRouter = express.Router();

// CRUD Endpoints
subscriptionfeatureRouter.post("/subscription-features", createFeature);       // Create
subscriptionfeatureRouter.get("/subscription-features", getAllFeatures);       // Get all
subscriptionfeatureRouter.get("/subscription-features/:id", getFeatureById);   // Get one
subscriptionfeatureRouter.put("/subscription-features/:id", updateFeature);    // Update
subscriptionfeatureRouter.delete("/subscription-features/:id", deleteFeature); // Delete

module.exports = subscriptionfeatureRouter;
