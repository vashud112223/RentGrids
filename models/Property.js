const mongoose = require("mongoose");

const PropertySchema = new mongoose.Schema(
  {
    pid: {
      type: String,
      unique: true,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    description: { type: String },
    features: [{ type: mongoose.Schema.Types.ObjectId, ref: "Feature" }],
    amenities: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Landlord",
      required: true
    },
    propertyType: {
      type: String,
      enum: ["apartment", "house", "villa", "commercial", "land"],
      required: true
    },
    listingType: {
      type: String,
      enum: ["rent"],
      required: true
    },
    monthlyRent: { type: Number },
    securityDeposit: { type: Number },
    area: { type: Number, required: true },
    areaUnit: { type: String, enum: ["sqft", "sqm", "acre"], required: true },
    bedroom: { type: Number, default: 0 },
    bathroom: { type: Number, default: 0 },
    balcony: { type: Number, default: 0 },
    bhk: { type: Number, default: 0 },
    floorNo: { type: Number },
    totalFloors: { type: Number },
    furnishType: {
      type: String,
      enum: ["furnished", "semi-furnished", "unfurnished"],
      required: true
    },
    availableFrom: { type: Date },
    availableFor: { type: String, enum: ["Family", "Bachelors", "Anyone"] },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    isFeatured: { type: Boolean, default: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    locality: { type: String, required: true },
    landmark: { type: String },
    zipcode: { type: String, required: true },
    fullAddress: { type: String, required: true },
    latitude: { type: Number },
    longitude: { type: Number },
    images: [{ type: String }],
    documents: [{ type: String }]
  },
  { timestamps: true }
);

// 🔹 Pre-save hook to auto-generate unique pid like REN0001
PropertySchema.pre("save", async function (next) {
  if (this.isNew) {
    const Property = mongoose.model("Property", PropertySchema);
    const count = await Property.countDocuments();
    this.pid = `REN${(count + 1).toString().padStart(4, "0")}`;
  }
  next();
});

module.exports = mongoose.model("Property", PropertySchema);
