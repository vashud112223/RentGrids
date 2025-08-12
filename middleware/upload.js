const multer = require("multer");

// store file temporarily before sending to Cloudinary
const storage = multer.diskStorage({});
const upload = multer({ storage });

module.exports = upload;
