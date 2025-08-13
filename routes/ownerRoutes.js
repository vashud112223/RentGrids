const express = require("express");
const {authMiddleware} = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const {
  getOwnerProfile,
  createOwnerProfile,
  updateOwnerProfile,
  uploadOwnerPhoto,
  uploadOwnerFile,
  getOwnerDocuments,
  ownerRegister,
  ownerLogin,
  onwerLogout,
  ownerForgetPassword,
} = require("../controllers/ownerController");

const ownerRouter = express.Router();

ownerRouter.post("/owner/register",ownerRegister);

ownerRouter.post("/owner/login",ownerLogin)

ownerRouter.post("/owner/logout",onwerLogout)
ownerRouter.patch("/owner/forget-password", ownerForgetPassword)


// Get profile
ownerRouter.get("/owner/profile", authMiddleware, getOwnerProfile);

// Create profile
ownerRouter.post("/owner/profile", authMiddleware, createOwnerProfile);

// Update profile
ownerRouter.put("/owner/profile", authMiddleware, updateOwnerProfile);

// Upload/update photo
ownerRouter.post("/owner/profile/photo",authMiddleware,upload.single("photo"),uploadOwnerPhoto
);

// Upload/update document
ownerRouter.post("/owner/upload-document",authMiddleware,upload.single("file"),uploadOwnerFile
);

// view document
ownerRouter.get("/owner/view-document/:id", authMiddleware, getOwnerDocuments);

module.exports = { ownerRouter };
