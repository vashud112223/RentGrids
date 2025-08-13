const User = require("../models/User");
const cloudinary = require("../configuration/cloudinary");
const Landlord = require("../models/Landlord");
const Document = require("../models/Document");
const path = require("path");
const fs = require("fs");

// 1. Get User Profile
exports.getOwnerProfile = async (req, res) => {
  try {
    const owner = await Landlord.findOne({ _id: req.userId });
    if (!owner) return res.status(404).json({ message: "Profile not found" });
    res.json(owner);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Create owner Profile
exports.createOwnerProfile = async (req, res) => {
  try {
    const { dob, propertyType } = req.body;
    const parsedDob = new Date(dob);

    const exists = await Landlord.findOne({ _id: req.userId });
    if (!exists)
      return res.status(400).json({ message: "Profile does not exists" });

    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          dob: parsedDob,
          propertyType: propertyType,
        },
      },
      { new: true, runValidators: true }
    );

    res.status(201).json({ message: "Profile created successfully", owner });
  } catch (err) {
    console.error("Error creating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 3. Update owner Profile (without photo)
exports.updateOwnerProfile = async (req, res) => {
  try {
    const { dob, propertyType } = req.body;
    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          dob: dob,
          propertyType: propertyType,
        },
      },
      { new: true, runValidators: true }
    );
    if (!owner) return res.status(404).json({ message: "Profile not found" });
    res.json({ message: "Profile updated successfully", owner });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 4. Upload/Update Photo
exports.uploadOwnerPhoto = async (req, res) => {
  try {
    console.log("File",req)
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "owner_photos",
    });

    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      { photo: result.secure_url },
      { new: true }
    );

    if (!owner) return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Photo uploaded successfully", owner });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadOwnerFile = async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      const { documentType } = req.body;
      if (!documentType) {
        return res.status(400).json({ message: "documentType is required" });
      }

      const newDoc = new Document({
        ownerId: req.userId,
        documentType,
        filePath: req.file.path
      });

      await newDoc.save();

      res.status(201).json({
        message: "Document uploaded successfully",
        document: newDoc
      });
    } catch (err) {
      res.status(500).json({ message: "Error uploading document", error: err.message });
    }
  };

  exports.getOwnerDocuments = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    const absolutePath = path.resolve(document.filePath);
    res.sendFile(absolutePath);
  } catch (error) {
    res.status(500).json({
      message: "Error viewing document",
      error: error.message
    });
  }
};