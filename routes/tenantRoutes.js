const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  getTenantProfile,
  createTenantProfile,
  updateTenantProfile,
  uploadTenantPhoto
} = require("../controllers/tenantController");

const tenantRouter = express.Router();

// Get profile
tenantRouter.get("/profile", authMiddleware, getTenantProfile);

// Create profile
tenantRouter.post("/profile", authMiddleware, createTenantProfile);

// Update profile
tenantRouter.put("/profile", authMiddleware, updateTenantProfile);

// Upload/update photo
tenantRouter.post("/profile/photo", authMiddleware, upload.single("photo"), uploadTenantPhoto);

module.exports = {tenantRouter};
