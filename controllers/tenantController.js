const User = require("../models/User");
const cloudinary = require("../configuration/cloudinary");
const fs = require("fs");

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
    const { fullName, phonenumber, address, dob } = req.body;

    const exists = await User.findOne({ _id: req.userId });
    if (!exists) return res.status(400).json({ message: "Profile does not exists" });

    const parsedDob = new Date(dob);
    const tenant = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          fullName: fullName,
          address: address,
          dob: parsedDob
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
    const { fullName, address } = req.body;
    const tenant = await User.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          fullName: fullName,
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

// 5. Upload/Update Document
exports.uploadTenantDocument = async (req, res) => {
  try {
    const { docName } = req.body;

    if (!docName || !req.file) {
      return res.status(400).json({ message: "Document name and file are required" });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "tenant_documents"
    });

     // Clean up local temp file (important!)
    fs.unlinkSync(req.file.path);
    const tenant = await User.findOne({ _id: req.userId });
    if (!tenant) return res.status(404).json({ message: "Profile not found" });

    // Ensure documents array exists
    if (!tenant.documents) tenant.documents = [];

    // Check if document already exists
    const existingDocIndex = tenant.documents.findIndex(
      (doc) => doc.docName.toLowerCase() === docName.toLowerCase()
    );

    if (existingDocIndex > -1) {
      // Update existing document URL
      tenant.documents[existingDocIndex].url = result.secure_url;
    } else {
      // Add new document
      tenant.documents.push({ docName, url: result.secure_url });
    }

    await tenant.save();

    res.json({ message: "Document uploaded successfully", documents: tenant.documents });
  } catch (err) {
    console.error("Error uploading document:", err);
    res.status(500).json({ message: "Server error" });
  }
};
