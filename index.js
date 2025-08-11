require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { connectDb } = require("./configuration/database");

const authRoutes = require("./routes/auth");

const app = express();
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", authRoutes);

// Connect DB and Start Server
connectDb()
  .then(() => {
    console.log("Database connection established");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port ${process.env.PORT}`);
    });
  })
  .catch(() => {
    console.error("Database connection cannot be established");
  });
