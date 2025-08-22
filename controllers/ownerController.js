const User = require("../models/User");
const cloudinary = require("../configuration/cloudinary");
const Landlord = require("../models/Landlord");
const Document = require("../models/Document");
const path = require("path");
const fs = require("fs");
const { ValidateUser } = require("../utils/validation");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const { generateToken } = require("../middleware/authMiddleware");

const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

// REGISTER
exports.ownerRegister = async (req, res) => {
  try {
    ValidateUser(req); // Validate user input
    const { fullName, emailId, password, phonenumber } = req.body;

    const existingUser = await Landlord.findOne({
      $or: [{ emailId }, { phonenumber }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "EmailId or phonenumber is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new Landlord({
      fullName,
      emailId,
      password: hashedPassword,
      phonenumber,
      // profile,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully",newUser });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// LOGIN
exports.ownerLogin = async (req, res) => {
  try {
    const { userName, password } = req.body;

    if (!userName || !password) {
      return res.status(400).json({ message: "Email or password required" });
    }
    let user;
    if (!validator.isEmail(userName)) {
      user = await Landlord.findOne({ phonenumber: userName });
    } else {
      user = await Landlord.findOne({ emailId: userName });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = generateToken(user);
    res.cookie("token", token);
    // res.json({ message: "Login successful", token });
    res.status(200).json({ message: "Login successful" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Logout
exports.onwerLogout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.json({ message: "Logout successfully" });
};

//Forget Password
exports.ownerForgetPassword = async (req, res) => {
  try {
    const { emailId, updatedPassword } = req.body;
    const user = await Landlord.findOne({ emailId: emailId });
    if (!user) {
      throw new Error("Invalid Email Id");
    }
    if (!validator.isStrongPassword(updatedPassword)) {
      throw new Error("Enter Strong Password: " + updatedPassword);
    }

    const passwordHash = await bcrypt.hash(updatedPassword, 10);
    user.password = passwordHash;
    console.log(user);
    await user.save();

    res.json({
      message: `${user.fullName}, your password is update succesfully`,
      data: user,
    });
  } catch (err) {
    res.status(400).send("Error on login: " + err.message);
  }
};

// 1. Get User Profile
exports.getOwnerProfile = async (req, res) => {
  try {
    const owner = await Landlord.findOne({ _id: req.userId });
    if (!owner) return res.status(404).json({ message: "Profile not found" });
    res.json(owner);
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// 2. Create owner Profile
exports.createOwnerProfile = async (req, res) => {
  try {
    const { dob, propertyType } = req.body;
    const parsedDob = new Date(dob);

    const exists = await Landlord.findOne({ _id: req.userId });
    if (!exists)
      return res.status(400).json({ message: "Profile does not exists" });

    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          dob: parsedDob,
          propertyType: propertyType,
        },
      },
      { new: true, runValidators: true }
    );
    // Format DOB for response
    const formattedOwner = {
      ...owner.toObject(),
      dob: formatDate(owner.dob),
    };
    res
      .status(201)
      .json({ message: "Profile created successfully", owner: formattedOwner });
  } catch (err) {
    console.error("Error creating profile:", err);
    if (err.name === "ValidationError") {
      // Extract the first validation error message
      const firstError = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstError });
    }

    res.status(500).json({ message: "Error Creating profile" });
  }
};

// 3. Update owner Profile (without photo)
exports.updateOwnerProfile = async (req, res) => {
  try {
    const { fullName, dob, propertyType } = req.body;
    const parsedDob = new Date(dob);
    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      {
        $set: {
          fullName: fullName,
          dob: parsedDob,
          propertyType: propertyType,
        },
      },
      { new: true, runValidators: true }
    );

    if (!owner) {
      return res.status(404).json({ message: "Profile not found" });
    }
    // Format DOB for response
    const formattedOwner = {
      ...owner.toObject(),
      dob: formatDate(owner.dob),
    };

    res.json({
      message: "Profile updated successfully",
      owner: formattedOwner,
    });
  } catch (err) {
    console.error("Error updating profile:", err);

    if (err.name === "ValidationError") {
      // Extract the first validation error message
      const firstError = Object.values(err.errors)[0]?.message;
      return res.status(400).json({ message: firstError });
    }

    res.status(500).json({ message: "Error updating profile" });
  }
};

// 4. Upload/Update Photo
exports.uploadOwnerPhoto = async (req, res) => {
  try {
    console.log("File", req);
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "owner_photos",
    });

    const owner = await Landlord.findOneAndUpdate(
      { _id: req.userId },
      { photo: result.secure_url },
      { new: true }
    );

    if (!owner) return res.status(404).json({ message: "Profile not found" });

    res.json({ message: "Photo uploaded successfully", owner });
  } catch (err) {
    console.error("Error uploading photo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.uploadOwnerFile = async (req, res) => {
  try {
    // Check if file is uploaded
    if (!req.file) {
      return res.status(400).json({ message: "PDF file is required" });
    }

    // Validate document type
    const { documentType } = req.body;
    if (!documentType) {
      return res.status(400).json({ message: "documentType is required" });
    }

    // Upload file to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "owner_documents",
      resource_type: "auto"
    });

    // Check if a document already exists for this owner and type
    let ownerDoc = await Document.findOne({
      ownerId: req.userId,
      documentType: documentType
    });

    if (ownerDoc) {
      // Update existing document
      ownerDoc.filePath = result.secure_url;
      await ownerDoc.save();
    } else {
      // Create a new document record
      ownerDoc = new Document({
        ownerId: req.userId,
        documentType,
        filePath: result.secure_url
      });
      await ownerDoc.save();
    }

    res.status(201).json({
      message: "Document uploaded successfully",
      document: ownerDoc
    });

  } catch (err) {
    res.status(500).json({
      message: "Error uploading document",
      error: err.message
    });
  }
};

exports.getOwnerDocuments = async (req, res) => {
  try {
    const documentId = req.params.id;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    // Redirect user to Cloudinary file
    return res.redirect(document.filePath);
  } catch (error) {
    res.status(500).json({
      message: "Error viewing document",
      error: error.message,
    });
  }
};

