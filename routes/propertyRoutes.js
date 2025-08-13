const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/authMiddleware");
const { createProperty,updateProperty,updatePropertyStatus } = require("../controllers/propertyController");

const upload = multer({ dest: "uploads/" });

const propertyRouter = express.Router();

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

module.exports = {propertyRouter};
