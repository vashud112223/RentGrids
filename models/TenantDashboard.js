const mongoose = require("mongoose");
const validator = require("validator");

const TenantDashboardSchema = new mongoose.Schema(
  {
    // tenantId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "User",
    //   required: true,
    // },
    // personalDetails: {
    //   age: {
    //     type: Number,
    //     // required: [true, "Age is required"],
    //     min: [18, "Age must be at least 18"],
    //     max: [100, "Age must be below 100"],
    //     validate: {
    //       validator: Number.isInteger,
    //       message: "Age must be a valid number",
    //     },
    //   },
    //   employer: {
    //     type: String,
    //     // enum: ["employee", "student", "other"],
    //     // required: [true, "Employer type is required"],
    //   },
    //   occupation: {
    //     type: String,
    //     minlength: [2, "Occupation must be at least 2 characters long"],
    //     maxlength: [50, "Occupation cannot exceed 50 characters"],
    //     trim: true,
    //   },
    // },

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
          validator: (value) => !value || validator.isMobilePhone(value, "any"),
          message: "Invalid landlord contact number",
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

module.exports = mongoose.model("TenantDashboard", TenantDashboardSchema);
