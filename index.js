require("dotenv").config();
const express = require("express");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const { connectDb } = require("./configuration/database");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const app = express();

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
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "Lax", 
    secure: false, 
  });
  res.json({ message: "Logout successful" });
});


connectDb()
  .then(() => {
    console.log("Database connection established");
    app.listen(process.env.PORT, () => {
      console.log("Server is successfully on port 3000");
    });
  })
  .catch((err) => {
    console.error("Database connection cannot be established");
  });
