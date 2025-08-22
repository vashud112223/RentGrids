const express = require("express");
const multer = require("multer");
const {authMiddleware} = require("../middleware/authMiddleware");
const {
  createProperty,
  updateProperty,
  updatePropertyStatus,
  getOwnerProperties,
  getPropertyById,
  deleteProperty,
  uploadPropertyImages,
  deletePropertyImage,
  uploadPropertyDocuments,
  deletePropertyDocument,
  getAllPropertiesFilter
} = require("../controllers/propertyController");


const upload = multer({ dest: "uploads/" });
const propertyRouter = express.Router();
propertyRouter.get("/properties", getAllPropertiesFilter);
propertyRouter.get("/properties/owner", authMiddleware, getOwnerProperties);
propertyRouter.get("/properties/:id", authMiddleware, getPropertyById);
propertyRouter.get("/propertiesGlobal/:id",getPropertyById);

propertyRouter.post(
  "/properties",
  authMiddleware,
  upload.fields([
    { name: "images", maxCount: 10 },
    { name: "documents", maxCount: 5 }
  ]),
  createProperty
);

propertyRouter.patch("/properties/:id/status", authMiddleware, updatePropertyStatus);
propertyRouter.put("/properties/:id", authMiddleware, updateProperty);
propertyRouter.delete("/properties/:id", authMiddleware, deleteProperty);
propertyRouter.post(
  "/properties/:id/images",
  authMiddleware,
  upload.array("images", 10), // Allow up to 10 images
  uploadPropertyImages
);
propertyRouter.delete(
  "/properties/:id/images",
  authMiddleware,
  deletePropertyImage
);
propertyRouter.post(
  "/properties/:id/documents",
  authMiddleware,
  upload.fields([{ name: "documents", maxCount: 10 }]),
  uploadPropertyDocuments
);
propertyRouter.delete(
  "/properties/:id/documents",
  authMiddleware,
  deletePropertyDocument
);

module.exports = propertyRouter;
