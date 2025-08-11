const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { ValidateUser, authMiddleware } = require("../utils/validation");

const router = express.Router();

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// REGISTER
router.post("/register", async (req, res) => {
  try {
    ValidateUser(req); // Validate user input
    const { fullName, emailId, password, phonenumber } = req.body;

    const existingUser = await User.findOne({ emailId });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      emailId,
      password: hashedPassword,
      phonenumber,
    });

    await newUser.save();
    res.status(201).json({ message: "User registered successfully" });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { emailId, password } = req.body;

    if (!emailId || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const user = await User.findOne({ emailId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true });
    res.json({ message: "Login successful", token });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.json({ message: "Logout successfully" });
});
router.patch("/forget", authMiddleware, async (req, res) => {
  try {
    const { emailId,updatedPassword } = req.body;
    console.log(updatedPassword);
    const user = await User.findOne({ emailId: emailId });
    const loggedInUser = req.user;
    console.log(loggedInUser);
    if (!validator.isStrongPassword(updatedPassword)) {
      throw new Error("Enter Strong Password: " + updatedPassword);
    }

    const passwordHash = await bcrypt.hash(updatedPassword, 10);
    loggedInUser.password = passwordHash;
    console.log(loggedInUser);
    loggedInUser.save();

    res.json({
      message: `${loggedInUser.firstName}, your password is update succesfully`,
      data: loggedInUser,
    });
  } catch (err) {
    res.status(400).send("Error on login: " + err.message);
  }
});

module.exports = router;
