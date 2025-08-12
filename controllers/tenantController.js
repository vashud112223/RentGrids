const User = require("../models/User");
const cloudinary = require("../configuration/cloudinary");

// 1. Get User Profile
exports.getTenantProfile = async (req, res) => {
  try {
    const tenant = await User.findOne({ _id: req.userId });
    if (!tenant) return res.status(404).json({ message: "Profile not found" });
    res.json(tenant);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Create Tenant Profile
exports.createTenantProfile = async (req, res) => {
  try {
    const { fullName, phonenumber, address } = req.body;

    const exists = await User.findOne({ _id: req.userId });
    if (!exists) return res.status(400).json({ message: "Profile does not exists" });

    const tenant = await User.findOneAndUpdate(
      { _id: req.userId },
      {
    $set: {
      fullName: fullName,
      // emailId:emailId,
      // phonenumber: phonenumber,
      address: address
    }
  },
      { new: true, runValidators: true }
    );

    res.status(201).json({ message: "Profile created successfully", tenant });
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Update Tenant Profile (without photo)
exports.updateTenantProfile = async (req, res) => {
  try {
    const {fullName,phonenumber,address}=req.body;
    const tenant = await User.findOneAndUpdate(
      { _id: req.userId },
      {
    $set: {
      fullName: fullName,
      phonenumber: phonenumber,
      address: address
    }
  },
      { new: true, runValidators: true }
    );
    if (!tenant) return res.status(404).json({ message: "Profile not found" });
    res.json({ message: "Profile updated successfully", tenant });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Upload/Update Photo
exports.uploadTenantPhoto = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "tenant_photos"
    });

    const tenant = await User.findOneAndUpdate(
      { _id: req.userId },
      { photo: result.secure_url },
      { new: true }
    );

    if (!tenant) return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Photo uploaded successfully", tenant });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ message: "Server error" });
  }
};
