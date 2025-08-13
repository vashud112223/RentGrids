const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const validator = require("validator");
const { ValidateUser, authMiddleware } = require("../utils/validation");
const nodemailer = require("nodemailer");
const { sendOtp, verifyOtp } = require("../utils/otp");
const passport = require("passport");
const Landlord = require("../models/Landlord");
const { generateToken } = require("../middleware/authMiddleware");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;

const router = express.Router();


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

// Oauth logic 

console.log("Google user callback URL:", `${process.env.CALLBACK_URL}/auth/user/google/callback`);

passport.use(
  "google",
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.CALLBACK_URL}/auth/google/callback`,
      passReqToCallback: true, // important for reading role
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const role = req.query.state || "user"; // 'landlord' or 'user'
        const email = profile.emails?.[0]?.value || null;

        let Model = role === "landlord" ? Landlord : User;

        let account = email ? await Model.findOne({ emailId: email }) : null;
        if (!account) {
          account = await Model.findOne({
            provider: "google",
            providerId: profile.id,
          });
        }

        if (!account) {
          account = new Model({
            fullName: profile.displayName,
            emailId: email,
            provider: "google",
            providerId: profile.id,
            profilePicture: profile.photos?.[0]?.value || null,
            authProvider: "google",
          });
          await account.save();
        }

        return done(null, account);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


// Start Google login (pass role as state param)
router.get("/auth/google", (req, res, next) => {
  const role = req.query.role || "user";
  passport.authenticate("google", {
    scope: ["profile", "email"],
    state: role, // role will come back as req.query.state
  })(req, res, next);
});

// Callback
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const token = generateToken(req.user);
    res.redirect(`${process.env.CLIENT_URL}/auth-success?token=${token}`);
  }
);




module.exports = { router };
