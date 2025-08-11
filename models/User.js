const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  
    fullName: {
      type: String,
      required: true,
      minLength: 8,
    },
    emailId: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error("Invalid Email Id: " + value);
        }
      },
    },
    password: {
      type: String,
      required: true,
      validate(value) {
        if (!validator.isStrongPassword(value)) {
          throw new Error("Enter Strong Password: " + value);
        }
      },
    },
  phonenumber: {
    type: String, // Use String so leading zeros aren't lost
    required: [true, "Phone number is required"],
    match: [
      /^[0-9]{10}$/,
      "Phone number must be exactly 10 digits"
    ],
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

module.exports = mongoose.model('User', UserSchema);
