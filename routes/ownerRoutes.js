const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  getOwnerProfile,
  createOwnerProfile,
  updateOwnerProfile,
  uploadOwnerPhoto,
  uploadOwnerFile,
  getOwnerDocuments,
} = require("../controllers/ownerController");

const ownerRouter = express.Router();

// Get profile
ownerRouter.get("/owner/profile", authMiddleware, getOwnerProfile);

// Create profile
ownerRouter.post("/owner/profile", authMiddleware, createOwnerProfile);

// Update profile
ownerRouter.put("/owner/profile", authMiddleware, updateOwnerProfile);

// Upload/update photo
ownerRouter.post(
  "/owner/profile/photo",
  authMiddleware,
  upload.single("photo"),
  uploadOwnerPhoto
);

ownerRouter.post(
  "/owner/upload-document",
  authMiddleware,
  upload.single("file"),
  uploadOwnerFile
);

ownerRouter.get("/owner/view-document/:id", authMiddleware, getOwnerDocuments);

module.exports = { ownerRouter };
