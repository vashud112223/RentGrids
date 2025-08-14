const Amenity = require("../models/Amenity");
const cloudinary = require("../configuration/cloudinary");

// 📌 Create Amenity
exports.createAmenity = async (req, res) => {
  try {
    let iconUrl = null;

    // Upload icon if provided
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "amenity_icons"
      });
      iconUrl = result.secure_url;
    }

    const amenity = new Amenity({
      name: req.body.name,
      icon: iconUrl
    });

    await amenity.save();

    res.status(201).json({ success: true, message: "Amenity created", data: amenity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get All Amenities
exports.getAllAmenities = async (req, res) => {
  try {
    const amenities = await Amenity.find();
    res.json({ success: true, data: amenities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Get Amenity by ID
exports.getAmenityById = async (req, res) => {
  try {
    const amenity = await Amenity.findById(req.params.id);
    if (!amenity) return res.status(404).json({ success: false, message: "Amenity not found" });
    res.json({ success: true, data: amenity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Update Amenity
exports.updateAmenity = async (req, res) => {
  try {
    let updateData = { name: req.body.name, isActive: req.body.isActive };

    // If new icon uploaded, replace it
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "amenity_icons"
      });
      updateData.icon = result.secure_url;
    }

    const amenity = await Amenity.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    if (!amenity) return res.status(404).json({ success: false, message: "Amenity not found" });

    res.json({ success: true, message: "Amenity updated", data: amenity });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📌 Delete Amenity
exports.deleteAmenity = async (req, res) => {
  try {
    const amenity = await Amenity.findByIdAndDelete(req.params.id);
    if (!amenity) return res.status(404).json({ success: false, message: "Amenity not found" });
    res.json({ success: true, message: "Amenity deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
