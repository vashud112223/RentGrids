const express = require("express");
const upload = require("../middleware/upload");
const {
  createFeature,
  getAllFeatures,
  getFeatureById,
  updateFeature,
  deleteFeature
} = require("../controllers/featureController");

const featureRouter = express.Router();

// Create Feature (with optional icon upload)
featureRouter.post("/", upload.single("icon"), createFeature);

// Get all Features
featureRouter.get("/", getAllFeatures);

// Get Feature by ID
featureRouter.get("/:id", getFeatureById);

// Update Feature (with optional icon upload)
featureRouter.put("/:id", upload.single("icon"), updateFeature);

// Delete Feature
featureRouter.delete("/:id", deleteFeature);

module.exports = featureRouter;
