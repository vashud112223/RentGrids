const SubscriptionFeature = require("../models/SubscriptionFeature");

// CREATE Feature
const createFeature = async (req, res) => {
  try {
    const { name, description, isPremium } = req.body;

    const existing = await SubscriptionFeature.findOne({ name });
    if (existing) {
      return res.status(400).json({ success: false, message: "Feature already exists" });
    }

    const feature = new SubscriptionFeature({ name, description, isPremium });
    await feature.save();

    res.status(201).json({ success: true, data: feature });
  } catch (error) {
    console.error("Error creating feature:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// READ All Features
const getAllFeatures = async (req, res) => {
  try {
    const features = await SubscriptionFeature.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: features });
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// READ Single Feature
const getFeatureById = async (req, res) => {
  try {
    const feature = await SubscriptionFeature.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });

    res.status(200).json({ success: true, data: feature });
  } catch (error) {
    console.error("Error fetching feature:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE Feature
const updateFeature = async (req, res) => {
  try {
    const { name, description, isPremium } = req.body;

    const feature = await SubscriptionFeature.findByIdAndUpdate(
      req.params.id,
      { name, description, isPremium },
      { new: true, runValidators: true }
    );

    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });

    res.status(200).json({ success: true, data: feature });
  } catch (error) {
    console.error("Error updating feature:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE Feature
const deleteFeature = async (req, res) => {
  try {
    const feature = await SubscriptionFeature.findByIdAndDelete(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });

    res.status(200).json({ success: true, message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createFeature,
  getAllFeatures,
  getFeatureById,
  updateFeature,
  deleteFeature
};
