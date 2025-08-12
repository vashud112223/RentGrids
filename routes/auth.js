const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validator = require("validator");
const { ValidateUser, authMiddleware } = require("../utils/validation");
const nodemailer = require("nodemailer");
const { sendOtp, verifyOtp } = require("../utils/otp");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

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
    const { fullName, emailId, password, phonenumber} = req.body;

    const existingUser = await User.findOne({
      $or: [{ emailId }, { phonenumber }],
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ message: "EmailId or phonenumber is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      fullName,
      emailId,
      password: hashedPassword,
      phonenumber,
      // profile,
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
    const { userName, password} = req.body;

    if (!userName || !password) {
      return res
        .status(400)
        .json({ message: "Email or password required" });
    }
    let user;
    if (!validator.isEmail(userName)) {
      user = await User.findOne({ phonenumber: userName });
    } else {
      user = await User.findOne({ emailId: userName });
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
    res.status(200).send("logged in!!!");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

//Logout
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.json({ message: "Logout successfully" });
});

// Forget password
router.patch("/forget-password", async (req, res) => {
  try {
    const { emailId, updatedPassword } = req.body;
    const user = await User.findOne({ emailId: emailId });
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
});

// OTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post("/emailVerification/otp-send", sendOtp);
router.post("/emailVerification/verify-otp", verifyOtp);

// =======================
// PASSPORT CONFIG
// =======================
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.CALLBACK_URL}/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        const email = profile.emails?.[0]?.value || null;

        // First: check if a user already exists with this email
        let user = email ? await User.findOne({ emailId: email }) : null;

        if (!user) {
          user = await User.findOne({
            provider: "google",
            providerId: profile.id,
          });
          user = new User({
            fullName: profile.displayName,
            emailId: profile.emails?.[0]?.value || null,
            provider: "google",
            providerId: profile.id,
            profilePicture: profile.photos?.[0]?.value || null,
            authProvider: "google",
          });
          await user.save();
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// passport.use(new FacebookStrategy({
//   clientID: process.env.FACEBOOK_APP_ID,
//   clientSecret: process.env.FACEBOOK_APP_SECRET,
//   callbackURL: `${process.env.CALLBACK_URL}/auth/facebook/callback`,
//   profileFields: ["id", "displayName", "emails", "photos"]
// }, (accessToken, refreshToken, profile, done) => {
//   // Same DB check here
//   return done(null, profile);
// }));

// =======================
// ROUTES
// =======================

// Google Login
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user); // uses your existing JWT generator
    res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
  }
);

// Facebook Login
// router.get("/auth/facebook", passport.authenticate("facebook", { scope: ["email"] }));
// router.get("/auth/facebook/callback",
//   passport.authenticate("facebook", { session: false, failureRedirect: "/login" }),
//   (req, res) => {
//     const token = jwt.sign(
//       { id: req.user.id, name: req.user.displayName, provider: "facebook" },
//       process.env.JWT_SECRET,
//       { expiresIn: "1h" }
//     );
//     res.json({ token });
//   }
// );

module.exports = { router };
