const mongoose = require("mongoose");
const validator = require("validator");

const UserSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      minlength: [3, "Full name must be at least 3 characters long"],
      maxlength: [50, "Full name cannot exceed 50 characters"],
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
          // Skip validation if password not provided (for social login)
          return !value || validator.isStrongPassword(value);
        },
        message:
          "Password must be at least 8 characters long and include uppercase, lowercase, number, and special character",
      },
    },

    phonenumber: {
      type: String,
      unique: true,
      sparse: true,
      validate: {
        validator: function (value) {
          return !value || validator.isMobilePhone(value, "any");
        },
        message: (props) => `Invalid Phone Number: ${props.value}`,
      },
    },

    dob: {
      type: Date,
      validate: {
        validator: function (value) {
          if (!value) return true;
          return value <= new Date();
        },
        message: "Date of birth cannot be in the future",
      },
    },

    authProvider: {
      type: String,
      enum: ["local", "google", "facebook"],
      default: "local",
    },

    providerId: {
      type: String,
      sparse: true,
      trim: true,
    },

    documents: [
      {
        docName: {
          type: String,
          required: [true, "Document name is required"],
          trim: true,
        },
        url: {
          type: String,
          required: [true, "Document URL is required"],
          validate: {
            validator: (value) => validator.isURL(value),
            message: "Invalid document URL",
          },
        },
      },
    ],

    address: {
      type: String,
      minlength: [5, "Address must be at least 5 characters long"],
      maxlength: [200, "Address cannot exceed 200 characters"],
      trim: true,
    },

    photo: {
      type: String,
      default: null,
      validate: {
        validator: function (value) {
          return !value || validator.isURL(value);
        },
        message: "Photo must be a valid URL",
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
    personalDetails: {
      age: {
        type: Number,
        // required: [true, "Age is required"],
        min: [18, "Age must be at least 18"],
        max: [100, "Age must be below 100"],
        validate: {
          validator: Number.isInteger,
          message: "Age must be a valid number",
        },
      },
      employer: {
        type: String,
        // enum: ["employee", "student", "other"],
        // required: [true, "Employer type is required"],
      },
      occupation: {
        type: String,
        minlength: [2, "Occupation must be at least 2 characters long"],
        maxlength: [50, "Occupation cannot exceed 50 characters"],
        trim: true,
      },
    },
  propertyPreferences: {
      bhkType: {
        type: String,
        enum: ["1BHK", "2BHK", "3BHK", "4BHK", "Studio"],
        // required: [true, "BHK type is required"],
      },
      furnishingType: {
        type: String,
        enum: ["furnished", "semi-furnished", "unfurnished"],
        // required: [true, "Furnishing type is required"],
      },
      amenities: {
        type: [String],
        validate: {
          validator: (arr) => arr.every((a) => typeof a === "string"),
          message: "Amenities must be a list of strings",
        },
      },
      occupants: {
        type: Number,
        min: [1, "There must be at least 1 occupant"],
        max: [20, "Occupants cannot exceed 20"],
      },
      budgetMin: {
        type: Number,
        min: [1000, "Minimum budget must be at least 1000"],
      },
      budgetMax: {
        type: Number,
        validate: {
          validator: function (value) {
            return !this.budgetMin || value >= this.budgetMin;
          },
          message:
            "Maximum budget must be greater than or equal to Minimum budget",
        },
      },
      location: {
        type: String,
        trim: true,
        // required: [true, "Preferred location is required"],
      },
      leaseDuration: {
        type: String,
        enum: ["6 months", "1 year", "2 years", "3 years+"],
      },
      moveInDate: {
        type: Date,
        validate: {
          validator: (value) => !value || value >= new Date(),
          message: "Move-in date must be today or in the future",
        },
      },
    },
    preferences: {
      gender: { type: String, enum: ["male", "female", "other"] },
      maritalStatus: {
        type: String,
        enum: ["single", "married", "divorced", "widowed"],
      },
      smoker: { type: Boolean, default: false },
      eating: { type: String, enum: ["veg", "non-veg", "vegan", "other"] },
      language: { type: String, minlength: 2, maxlength: 30 },
      pet: { type: Boolean, default: false },
      coupleFriendly: { type: Boolean, default: false },
    },

    rentalHistory: {
      duration: { type: String, trim: true },
      landlordContact: {
      type: String,
      validate: {
        validator: function (value) {
          return !value || validator.isMobilePhone(value, "any");
        },
        message: (props) => `Invalid Phone Number: ${props.value}`,
      },
      },
      previousAddress: { type: String, minlength: 5, maxlength: 200 },
      documents: {
        type: [String],
        validate: {
          validator: (arr) => arr.every((url) => validator.isURL(url)),
          message: "All rental documents must be valid URLs",
        },
      },
    },

    videoIntro: {
      type: String,
      validate: {
        validator: (value) => !value || validator.isURL(value),
        message: "Video intro must be a valid URL",
      },
    },

    dailyApplications: {
      submitted: {
        type: Number,
        default: 0,
        min: [0, "Submitted applications cannot be negative"],
      },
      remaining: {
        type: Number,
        default: 3,
        min: [0, "Remaining applications cannot be negative"],
      },
    },
  },
  { timestamps: true }
);

// Conditional required fields
UserSchema.pre("validate", function (next) {
  if (this.authProvider === "local") {
    if (!this.password) this.invalidate("password", "Password is required");
    if (!this.phonenumber)
      this.invalidate("phonenumber", "Phone number is required");
  } else {
    if (!this.providerId)
      this.invalidate("providerId", "Provider ID is required");
  }
  next();
});

module.exports = mongoose.model("User", UserSchema);
