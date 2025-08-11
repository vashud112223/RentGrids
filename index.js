require("dotenv").config();
const express = require("express");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const { connectDb } = require("./configuration/database");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();
const nodemailer =require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  })
);

app.use(express.json());
app.use(cookieParser());

//generate token
const generateToken = (user) => {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

//Middleware for authentication
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;
  console.log(token);
  if (!token) return res.status(400).json({ message: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(400).json({ message: "Invalid token" });
  }
};

//login or sign up
app.post("/login", async (req, res) => {
  const { email, password, fullname, phonenumber } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "email and password required" });
  let user = await User.findOne({ email });
  if (!user) {
    // Register new user
    const hashedPassword = await bcrypt.hash(password, 10);
    user = new User({ fullname, email, password: hashedPassword, phonenumber });
    await user.save();
  } else {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ message: "Incorrect password." });
  }

  const token = generateToken(user);
  res.cookie("token", token);
  res.json({ token });
});

//logout 
app.post("/logout", async (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax", 
    secure: false, 
  });
  res.json({ message: "Logout successful" });
});
const otpStore = new Map();

app.post("/emailVerification/otp-send",async(req,res)=>{
  console.log("jkbj");
   const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit OTP
  otpStore.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 min expiry

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP Code',
    text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'OTP sent successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to send OTP', details: err.message });
  }
})

app.post('/emailVerification/verify-otp',async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required' });

  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ error: 'No OTP found for this email' });

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (Number(otp) !== record.otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  otpStore.delete(email);
  res.json({ message: 'Email verified successfully' });
});

connectDb()
  .then(() => {
    console.log("Database connection established");
    app.listen(process.env.PORT, () => {
      console.log(`Server is successfully on port ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Database connection cannot be established");
  });
