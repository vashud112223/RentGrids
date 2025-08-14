const Property = require("../models/Property");
const cloudinary = require("../configuration/cloudinary");

// CREATE PROPERTY
const streamifier = require("streamifier");

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    let stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// const createProperty = async (req, res) => {
//   console.log("Body:", req.body);
//   console.log("Files:", req.files);
//   res.json({ body: req.body, files: req.files });
// };

const createProperty = async (req, res) => {
  try {
    const {
      title,
      description,
      propertyType,
      listingType,
      monthlyRent,
      securityDeposit,
      area,
      areaUnit,
      bedroom,
      bathroom,
      balcony,
      bhk,
      floorNo,
      totalFloors,
      furnishType,
      availableFrom,
      availableFor,
      status,
      isFeatured,
      city,
      state,
      locality,
      landmark,
      zipcode,
      fullAddress,
      latitude,
      longitude,
      features,
      amenities
    } = req.body;

    // ====== Validate required fields ======
    if (
      !title ||
      !description ||
      !propertyType ||
      !listingType ||
      !area ||
      !areaUnit ||
      !furnishType ||
      !city ||
      !state ||
      !locality ||
      !zipcode ||
      !fullAddress
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ====== Handle Image Upload ======
    let imageUrls = [];
    console.log(req.files);
    if (req.files && req.files.images) {
      for (const file of req.files.images) {
        let result;
        if (file.path) {
          // Disk storage
          result = await cloudinary.uploader.upload(file.path, {
            folder: "property_images"
          });
        } else {
          // Memory storage
          result = await uploadToCloudinary(file.buffer, "property_images");
        }
        imageUrls.push(result.secure_url);
      }
    }

    // ====== Handle Document Upload ======
    let documentUrls = [];
    if (req.files && req.files.documents) {
      for (const file of req.files.documents) {
        let result;
        if (file.path) {
          result = await cloudinary.uploader.upload(file.path, {
            folder: "property_documents"
          });
        } else {
          result = await uploadToCloudinary(file.buffer, "property_documents");
        }
        documentUrls.push(result.secure_url);
      }
    }

    // ====== Save to DB ======
    const property = new Property({
      ownerId: req.userId,
      title,
      description,
      propertyType,
      listingType,
      monthlyRent,
      securityDeposit,
      area,
      areaUnit,
      bedroom,
      bathroom,
      balcony,
      bhk,
      floorNo,
      totalFloors,
      furnishType,
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      availableFor,
      status,
      isFeatured,
      city,
      state,
      locality,
      landmark,
      zipcode,
      fullAddress,
      latitude,
      longitude,
      features: features ? JSON.parse(features) : [],
      amenities: amenities ? JSON.parse(amenities) : [],
      images: imageUrls,
      documents: documentUrls
    });

    await property.save();

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: property
    });
  } catch (error) {
    console.error("Error creating property:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};


const updateProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const updateData = {
      title: req.body.title,
      description: req.body.description,
      monthlyRent: req.body.monthly_rent,
      status: req.body.status
    };

    // Remove undefined or empty values so they won't overwrite existing data
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: updatedProperty._id,
        title: updatedProperty.title
      }
    });
  } catch (error) {
    console.error("Error updating property:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// PATCH - Update Property Status
const updatePropertyStatus = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { status } = req.body;

    // Validate status
    const validStatuses = ["draft", "published"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value. Allowed: draft, published"
      });
    }

    const updatedProperty = await Property.findByIdAndUpdate(
      propertyId,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updatedProperty) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    res.status(200).json({
      success: true,
      message: "Property status updated"
    });
  } catch (error) {
    console.error("Error updating property status:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// GET - All Properties for a specific owner
const getOwnerProperties = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;

    let filter = { ownerId : req.userId }; // Only properties of logged-in user

    if (status) filter.status = status; // Optional filter for status

    const skip = (Number(page) - 1) * Number(limit);

    const properties = await Property.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Property.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      data: properties
    });
  } catch (error) {
    console.error("Error fetching owner's properties:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// GET - Property by ID (Restricted to Owner)
const getPropertyById = async (req, res) => {
  try {
    const propertyId = req.params.id;

    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId // req.userId comes from authMiddleware
    })
      .populate("ownerId", "fullName emailId phonenumber")
      .populate("features")
      .populate("amenities");

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you are not authorized to view it"
      });
    }

    res.status(200).json({
      success: true,
      data: property
    });
  } catch (error) {
    console.error("Error fetching property by ID:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE - Property by ID (Only Owner can delete)
const deleteProperty = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Find property and check if owner matches
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you are not authorized to delete it"
      });
    }

    // Delete property
    await Property.deleteOne({ _id: propertyId });

    res.status(200).json({
      success: true,
      message: "Property deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting property:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};
// UPLOAD - Add Images to an Existing Property
const uploadPropertyImages = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Check if property exists and belongs to the logged-in user
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or you are not authorized"
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No images uploaded"
      });
    }

    let imageUrls = [];
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "property_images"
      });
      imageUrls.push(result.secure_url);
    }

    // Append new images to existing images array
    property.images = [...property.images, ...imageUrls];
    await property.save();

    res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      images: property.images
    });
  } catch (error) {
    console.error("Error uploading property images:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE - Remove a Specific Property Image
const deletePropertyImage = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { imageUrl } = req.body; // The exact image URL you want to delete

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required"
      });
    }

    // Find property and check ownership
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unauthorized"
      });
    }

    // Check if image exists in property
    if (!property.images.includes(imageUrl)) {
      return res.status(400).json({
        success: false,
        message: "Image not found in property"
      });
    }

    // Extract public_id from Cloudinary URL
    const publicId = imageUrl.split("/").pop().split(".")[0];

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(`property_images/${publicId}`);

    // Remove from DB
    property.images = property.images.filter(img => img !== imageUrl);
    await property.save();

    res.status(200).json({
      success: true,
      message: "Image deleted successfully",
      images: property.images
    });
  } catch (error) {
    console.error("Error deleting property image:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// UPLOAD - Property Documents
const uploadPropertyDocuments = async (req, res) => {
  try {
    const propertyId = req.params.id;

    // Check if property exists and belongs to current user
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unauthorized"
      });
    }

    if (!req.files || !req.files.documents) {
      return res.status(400).json({
        success: false,
        message: "No documents uploaded"
      });
    }

    const documentFiles = Array.isArray(req.files.documents)
      ? req.files.documents
      : [req.files.documents];

    let documentUrls = [];

    // Upload each file to Cloudinary
    for (const file of documentFiles) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "property_documents",
        resource_type: "auto" // auto-detect type (PDF, doc, image)
      });
      documentUrls.push(result.secure_url);
    }

    // Save to property
    property.documents.push(...documentUrls);
    await property.save();

    res.status(200).json({
      success: true,
      message: "Documents uploaded successfully",
      documents: property.documents
    });
  } catch (error) {
    console.error("Error uploading property documents:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// DELETE - Property Document
const deletePropertyDocument = async (req, res) => {
  try {
    const propertyId = req.params.id;
    const { docUrl } = req.body; // Document URL to delete

    if (!docUrl) {
      return res.status(400).json({
        success: false,
        message: "Document URL is required"
      });
    }

    // Find property & verify ownership
    const property = await Property.findOne({
      _id: propertyId,
      ownerId: req.userId
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found or unauthorized"
      });
    }

    // Check if document exists
    if (!property.documents.includes(docUrl)) {
      return res.status(404).json({
        success: false,
        message: "Document not found in property"
      });
    }

    // Extract public_id from Cloudinary URL
    const publicId = docUrl.split("/").slice(-1)[0].split(".")[0];
    const folderPath = "property_documents/" + publicId;

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(folderPath, { resource_type: "raw" });

    // Remove from MongoDB array
    property.documents = property.documents.filter((url) => url !== docUrl);
    await property.save();

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
      documents: property.documents
    });
  } catch (error) {
    console.error("Error deleting property document:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


module.exports = {
  createProperty,
  updateProperty,
  updatePropertyStatus,
  getOwnerProperties,
  getPropertyById,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  uploadPropertyDocuments,
  deletePropertyDocument
};