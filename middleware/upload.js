const multer = require("multer");
const path = require("path");
const fs = require("fs");

// store file temporarily before sending to Cloudinary
//  const storages = multer.diskStorage({});
//  exports.upload = multer({ storages });

const uploadDir = path.join(__dirname, "../uploads");

// Ensure uploads folder exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + "-" + file.fieldname + ext);
  }
});

const fileFilter = (req, file, cb) => {
    cb(null, true);
//   if (file.mimetype === "application/pdf") {
//     cb(null, true);
//   } else {
//     cb(new Error("Only PDF files are allowed"), false);
//   }
};

module.exports = multer({ storage, fileFilter });
