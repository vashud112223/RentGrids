const express = require("express");
const upload = require("../middleware/upload");
const {
  createAmenity,
  getAllAmenities,
  getAmenityById,
  updateAmenity,
  deleteAmenity
} = require("../controllers/amenityController");

const amenityRouter = express.Router();

// Create Amenity (with optional icon upload)
amenityRouter.post("/", upload.single("icon"), createAmenity);

// Get all Amenities
amenityRouter.get("/", getAllAmenities);

// Get Amenity by ID
amenityRouter.get("/:id", getAmenityById);

// Update Amenity (with optional icon upload)
amenityRouter.put("/:id", upload.single("icon"), updateAmenity);

// Delete Amenity
amenityRouter.delete("/:id", deleteAmenity);

module.exports ={ amenityRouter };
