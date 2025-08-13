const Feature = require("../models/Feature");
const cloudinary = require("../configuration/cloudinary");

// 📌 Create Feature
exports.createFeature = async (req, res) => {
  try {
    let iconUrl = null;

    // Upload icon if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "feature_icons"
      });
      iconUrl = result.secure_url;
    }

    const feature = new Feature({
      name: req.body.name,
      icon: iconUrl
    });

    await feature.save();

    res.status(201).json({ success: true, message: "Feature created", data: feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get All Features
exports.getAllFeatures = async (req, res) => {
  try {
    const features = await Feature.find();
    res.json({ success: true, data: features });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get Feature by ID
exports.getFeatureById = async (req, res) => {
  try {
    const feature = await Feature.findById(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });
    res.json({ success: true, data: feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Update Feature
exports.updateFeature = async (req, res) => {
  try {
    let updateData = { name: req.body.name, isActive: req.body.isActive };

    // If new icon uploaded, replace it
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "feature_icons"
      });
      updateData.icon = result.secure_url;
    }

    const feature = await Feature.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });

    res.json({ success: true, message: "Feature updated", data: feature });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Delete Feature
exports.deleteFeature = async (req, res) => {
  try {
    const feature = await Feature.findByIdAndDelete(req.params.id);
    if (!feature) return res.status(404).json({ success: false, message: "Feature not found" });
    res.json({ success: true, message: "Feature deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
