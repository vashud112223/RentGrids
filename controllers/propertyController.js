const Property = require("../models/Property");
const cloudinary = require("../configuration/cloudinary");

// CREATE PROPERTY
exports.createProperty = async (req, res) => {
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
    if (req.files && req.files.images) {
      const imageFiles = Array.isArray(req.files.images)
        ? req.files.images
        : [req.files.images];

      for (const file of imageFiles) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "property_images"
        });
        imageUrls.push(result.secure_url);
      }
    }

    // ====== Handle Document Upload ======
    let documentUrls = [];
    if (req.files && req.files.documents) {
      const documentFiles = Array.isArray(req.files.documents)
        ? req.files.documents
        : [req.files.documents];

      for (const file of documentFiles) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "property_documents"
        });
        documentUrls.push(result.secure_url);
      }
    }

    // ====== Save to DB ======
    const property = new Property({
      ownerId: req.userId, // from auth middleware
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
      features: features ? JSON.parse(features) : [], // expecting array of feature IDs
      amenities: amenities ? JSON.parse(amenities) : [], // expecting array of amenity IDs
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

exports.updateProperty = async (req, res) => {
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
exports.updatePropertyStatus = async (req, res) => {
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