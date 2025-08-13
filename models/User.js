const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      minlength: [3, "Full name must be at least 3 characters long"],
      trim: true,
      validate: {
        validator: (value) => /^[A-Za-z\s]+$/.test(value),
        message: "Full name must contain only alphabets and spaces",
      },
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
      validate: {
        validator: function (value) {
          // Only validate if password is provided (skip for social login)
          return !value || validator.isStrongPassword(value);
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },
    phonenumber: {
      type: String, // keep as string to preserve leading zeros
      unique: true,
      sparse: true, // allows multiple docs with undefined/null
      validate: {
        validator: function (value) {
          return !value || validator.isMobilePhone(value, "any");
        },
        message: (props) => `Invalid Phone Number: ${props.value}`,
      },
    },
    dob:{
      type:Date
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },
    providerId: {
      type: String,
      sparse: true, // not required for local login
      trim: true,
    },
    documents: [
      {
        docName: { type: String, required: true },
        url: { type: String, required: true }
      }
    ],
      address: {
    type: String
  },
  
      photo: {
  type: String, // URL of the tenant's photo
  default: null
  },
      // Status Flags
  isActive: {
    type: Boolean,
    default: true
  },
  },
  {
    timestamps: true,
  }
);

// Conditional required fields
UserSchema.pre("validate", function (next) {
  if (this.authProvider === "local") {
    if (!this.password) this.invalidate("password", "Password is required");
    if (!this.phonenumber)
      this.invalidate("phonenumber", "Phone number is required");
  } else {
    // For social login, providerId must be provided
    if (!this.providerId) this.invalidate("providerId", "Provider ID is required");
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
