const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      minlength: [3, "Full name must be at least 3 characters long"],
      trim: true,
    },
    emailId: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => validator.isEmail(value),
        message: (props) => `Invalid Email Id: ${props.value}`,
      },
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      validate: {
        validator: (value) => validator.isStrongPassword(value),
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },
    phonenumber: {
      type: String, // keep as string to preserve leading zeros
      required: [true, "Phone number is required"],
      validate: {
        validator: (value) => validator.isMobilePhone(value, "any"),
        message: (props) => `Invalid Phone Number: ${props.value}`,
      },
    },
    profile: {
      type: String,
      required: [true, "Profile is required"],
      enum: {
        values: ["Tenant", "Landlord"],
        message: `{value} is incorrect`,
      },
    },
  },

  {
    timestamps: true,
  }
);

// Ensure unique index is actually created

module.exports = mongoose.model("User", UserSchema);
