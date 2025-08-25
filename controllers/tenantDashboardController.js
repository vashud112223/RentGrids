// controllers/tenantDashboard.controller.js
const VisitRequest = require("../models/VisitRequest");
const SavedProperty = require("../models/SavedProperty");
const Property = require("../models/Property");
const User = require("../models/User");
const upload = require("../middleware/upload");
const TenantDashboard = require("../models/TenantDashboard");
const cloudinary = require("../configuration/cloudinary");
const fs = require("fs");

/**
 * Utility to shape property card data exactly like cards in images.
 */
const mapPropertyCard = (p, landlord, status) => ({
  propertyId: p._id,
  title: p.title, // "Skyline Apartment"
  location: `${p.area}, ${p.city}`, // "Meera Road, Mumbai"
  price: p.price, // 30000
  image: p.images?.[0] || null,
  landlord: landlord
    ? { name: landlord.fullName, avatarUrl: landlord.avatarUrl }
    : null,
  status, // "accepted" | "pending" | "rejected"
});

/**
 * GET /api/tenant/summary
 * For dashboard counters: Pending Visit Request, Requested Visited, Scheduled Visits, Saved Properties.
 */
exports.getSummary = async (req, res) => {
  const tenantId = req.userId;

  const [pending, accepted, rejected, scheduled, saved] = await Promise.all([
    VisitRequest.countDocuments({ tenantId, status: "pending" }),
    VisitRequest.countDocuments({ tenantId, status: "accepted" }),
    VisitRequest.countDocuments({ tenantId, status: "rejected" }),
    VisitRequest.countDocuments({
      tenantId,
      status: "accepted",
      "schedule.date": { $ne: null },
    }),
    SavedProperty.countDocuments({ tenantId }),
  ]);

  // Progress bar like "7/10" → backend returns both count and computed percent
  const totalSteps = 10;
  // you can compute "completedSteps" however you want; here: min(accepted + scheduled, totalSteps)
  const completedSteps = Math.min(accepted + scheduled, totalSteps);
  const percent = Math.round((completedSteps / totalSteps) * 100);

  res.json({
    cards: {
      pendingVisitRequest: pending,
      requestedVisited: accepted + rejected, // total processed
      scheduledVisits: scheduled,
      savedProperties: saved,
    },
    progress: { completedSteps, totalSteps, percent }, // e.g., {7,10,70}
  });
};

/**
 * GET /api/tenant/requests?status=pending|accepted|rejected&page=1&limit=12
 * For the Requested Visit tab list (cards).
 */
exports.getRequestsByStatus = async (req, res) => {
  const tenantId = req.userId;
  const { status = "pending", page = 1, limit = 12 } = req.query;

  const q = { tenantId, status };
  const skip = (Number(page) - 1) * Number(limit);

  const [rows, total] = await Promise.all([
    VisitRequest.find(q)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    VisitRequest.countDocuments(q),
  ]);

  const propertyIds = rows.map((r) => r.propertyId);
  const landlordIds = rows.map((r) => r.landlordId);
  const [props, landlords] = await Promise.all([
    Property.find({ _id: { $in: propertyIds } }).lean(),
    User.find({ _id: { $in: landlordIds } }).lean(),
  ]);

  const pMap = Object.fromEntries(props.map((p) => [p._id.toString(), p]));
  const lMap = Object.fromEntries(landlords.map((u) => [u._id.toString(), u]));

  const items = rows.map((r) =>
    mapPropertyCard(
      pMap[r.propertyId.toString()],
      lMap[r.landlordId.toString()],
      r.status
    )
  );

  res.json({
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
    items,
  });
};

/**
 * GET /api/tenant/requests/:propertyId/status
 * For “Check Status” button on a single card.
 */
exports.getRequestStatusForProperty = async (req, res) => {
  const tenantId = req.userId;
  const { propertyId } = req.params;

  const reqDoc = await VisitRequest.findOne({ tenantId, propertyId }).lean();

  if (!reqDoc) {
    // 404 screen data (“Application Rejected/Not found” style)
    return res.status(404).json({
      code: "VISIT_NOT_FOUND",
      message: "No application found for this property.",
      actions: [
        {
          type: "reapply",
          label: "Re-Apply to the Property",
          href: `/properties/${propertyId}/reapply`,
        },
        {
          type: "similar",
          label: "Explore Similar Listing",
          href: `/properties/${propertyId}/similar`,
        },
      ],
    });
  }

  res.json({
    requestId: reqDoc._id,
    status: reqDoc.status, // pending | accepted | rejected
    scheduled: !!reqDoc.schedule?.date,
    schedule: reqDoc.schedule || null, // { date, note }
    updatedAt: reqDoc.updatedAt,
  });
};

/**
 * POST /api/tenant/requests
 * Create a new visit request (clicking “Apply/Request Visit”)
 * Body: { propertyId }
 */
exports.createVisitRequest = async (req, res) => {
  const tenantId = req.userId;
  const { propertyId } = req.body;

  const property = await Property.findById(propertyId).lean();
  if (!property) return res.status(404).json({ message: "Property not found" });

  // prevent duplicates
  const existing = await VisitRequest.findOne({ tenantId, propertyId });
  if (existing)
    return res
      .status(409)
      .json({ message: "Request already exists", requestId: existing._id });

  const doc = await VisitRequest.create({
    tenantId,
    landlordId: property.ownerId,
    propertyId,
    status: "pending",
  });

  res.status(201).json({ requestId: doc._id, status: doc.status });
};

/**
 * POST /api/tenant/requests/:id/reapply
 * Re-apply after auto-rejection (button on the 404/Rejected screen).
 */
exports.reapply = async (req, res) => {
  const tenantId = req.userId;
  const { id } = req.params;

  const doc = await VisitRequest.findOne({ _id: id, tenantId });
  if (!doc) return res.status(404).json({ message: "Request not found" });

  doc.status = "pending";
  doc.schedule = undefined;
  await doc.save();

  res.json({ requestId: doc._id, status: doc.status });
};

/**
 * GET /api/tenant/scheduled
 * List only scheduled visits (accepted + with schedule.date).
 */
exports.getScheduled = async (req, res) => {
  try {
    const tenantId = req.userId;

    // Find all visit requests for this tenant where status is accepted and schedule date is not null
    const rows = await VisitRequest.find({
      tenantId,
      status: "accepted",
      "schedule.date": { $ne: null },
    }).lean();

    // Extract all unique property and landlord IDs
    const propertyIds = rows.map((r) => r.propertyId);
    const landlordIds = rows.map((r) => r.landlordId);

    // Fetch properties and landlords
    const [props, landlords] = await Promise.all([
      Property.find({ _id: { $in: propertyIds } }).lean(),
      User.find({ _id: { $in: landlordIds } }).lean(),
    ]);

    // Convert arrays into quick lookup maps
    const pMap = Object.fromEntries(props.map((p) => [p._id.toString(), p]));
    const lMap = Object.fromEntries(
      landlords.map((u) => [u._id.toString(), u])
    );

    // Build full response without filtering
    res.json(
      rows.map((r) => ({
        property: pMap[r.propertyId.toString()] || null,
        // landlord: lMap[r.landlordId.toString()] || null,
        visitRequest: r,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * Saved Properties (heart)
 */
exports.getSaved = async (req, res) => {
  const tenantId = req.userId;
  const rows = await SavedProperty.find({ tenantId }).lean();
  const ids = rows.map((r) => r.propertyId);
  const props = await Property.find({ _id: { $in: ids } }).lean();

  //   res.json(
  //     props.map((p) => ({
  //       propertyId: p._id,
  //       title: p.title,
  //       location: `${p.area}, ${p.city}`,
  //       price: p.price,
  //       image: p.images?.[0] || null,
  //       savedAt: rows.find((r) => r.propertyId.toString() === p._id.toString())
  //         ?.savedAt,
  //     }))
  //   );
  res.json(props);
};

exports.saveProperty = async (req, res) => {
  const tenantId = req.userId;
  const { propertyId } = req.body;

  const property = await Property.findById(propertyId).lean();
  if (!property) return res.status(404).json({ message: "Property not found" });

  const doc = await SavedProperty.findOneAndUpdate(
    { tenantId, propertyId },
    { $setOnInsert: { tenantId, propertyId, savedAt: new Date() } },
    { upsert: true, new: true }
  );
  res.status(201).json({ saved: true, propertyId: doc.propertyId });
};

exports.unsaveProperty = async (req, res) => {
  const tenantId = req.userId;
  const { propertyId } = req.params;
  await SavedProperty.deleteOne({ tenantId, propertyId });
  res.json({ saved: false, propertyId });
};

/**
 * Landlord endpoints (to drive accept/reject/schedule)
 * PATCH /api/landlord/requests/:id { action: "accept"|"reject"|"schedule", date?, note? }
 */
exports.landlordAct = async (req, res) => {
  const landlordId = req.userId; // must be landlord
  const { id } = req.params;
  const { action, date, note } = req.body;

  const doc = await VisitRequest.findOne({ _id: id, landlordId });
  if (!doc) return res.status(404).json({ message: "Request not found" });

  if (action === "accept") {
    doc.status = "accepted";
  } else if (action === "reject") {
    doc.status = "rejected";
    doc.schedule = undefined;
  } else if (action === "schedule") {
    doc.status = "scheduled";
    doc.schedule = { date, note };
  } else {
    return res.status(400).json({ message: "Invalid action" });
  }

  await doc.save();
  res.json({
    requestId: doc._id,
    status: doc.status,
    schedule: doc.schedule || null,
  });
};

/**
 * Similar listings for 404/CTA
 * GET /api/properties/:id/similar
 */
exports.getSimilar = async (req, res) => {
  const { id } = req.params;
  const base = await Property.findById(id).lean();
  if (!base) return res.status(404).json({ message: "Property not found" });

  const similar = await Property.find({
    _id: { $ne: id },
    city: base.city,
    // active: true,
  })
    .limit(6)
    .lean();
  res.json(similar);
  //   res.json(
  //     similar.map((p) => ({
  //       propertyId: p._id,
  //       title: p.title,
  //       location: `${p.area}, ${p.city}`,
  //       price: p.price,
  //       image: p.images?.[0] || null,
  //     }))
  //   );
};

// 1. Update personal details
// controllers/tenantController.js
exports.addPersonalDetails = async (req, res) => {
  try {
    const { id } = req.params; // tenantId from URL

    // Check if tenant already has personalDetails
    const existingTenant = await TenantDashboard.findOne({ tenantId: id });

    if (existingTenant && existingTenant.personalDetails) {
      return res.status(400).json({
        message: "Personal details already exist for this tenant",
      });
    }

    let tenant;

    if (existingTenant) {
      // If tenant exists but no personalDetails → update it
      existingTenant.personalDetails = req.body;
      tenant = await existingTenant.save();
    } else {
      // If tenant doesn't exist → create new record
      tenant = new TenantDashboard({
        tenantId: id,
        personalDetails: req.body,
      });
      await tenant.save();
    }

    res.status(201).json({
      message: "Tenant personal details saved successfully",
      data: tenant.personalDetails,
    });
    console.log(tenant.personalDetails);
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

exports.updatePersonalDetails = async (req, res) => {
  try {
    const { id } = req.params; // userId
    const { personalDetails } = req.body; // personalDetails object

    if (!personalDetails) {
      return res.status(400).json({ message: "personalDetails is required" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: { personalDetails } }, // update only personalDetails
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Personal details updated successfully",
      data: updatedUser.personalDetails,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

/**
 * ➡️ Update Tenant Property Preferences
 * PUT /api/tenant/:id/preferences
 */
exports.updatePropertyPreferences = async (req, res) => {
  try {
    const tenantId = req.params.id;
    const { propertyPreferences } = req.body;

    const user = await User.findByIdAndUpdate(
      tenantId,
      { $set: { propertyPreferences } },
      { new: true, runValidators: true }
    ).lean();

    if (!user) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    res.json({
      message: " Property Preferences updated",
      preferences: user.propertyPreferences,
    });
  } catch (err) {
    res.status(500).json({ error: err.message, err });
  }
};

// 3. Update lifestyle/preferences
exports.updatePreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { preferences } = req.body;
    const updatedTenant = await User.findByIdAndUpdate(
      id,
      { $set: { preferences } },
      { new: true, runValidators: true }
    );
    if (!updatedTenant)
      return res.status(404).json({ message: "Tenant not found" });
    res.json({
      message: " Property Preferences updated",
      preferences: updatedTenant.preferences,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

/**
 * ➡️ Upload Rental Document
 * POST /api/tenant/:id/upload-doc
 */

// 4. Update rental history
exports.updateRentalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { rentalHistory } = req.body;
    const updatedTenant = await User.findByIdAndUpdate(
      id,
      { $set: { rentalHistory } },
      { new: true, runValidators: true }
    );
    if (!updatedTenant)
      return res.status(404).json({ message: "Tenant not found" });
    res.json({
      message: " Rental history updated",
      preferences: updatedTenant.rentalHistory,
    });
  } catch (error) {
    res.status(500).json({ message: error.message, error });
  }
};

// exports.uploadRentalDocument = [
//   upload.single("document"), // middleware
//   async (req, res) => {
//     try {
//       const { docName } = req.body;

//       if (!docName || !req.file) {
//         return res
//           .status(400)
//           .json({ message: "Document name and file are required" });
//       }

//       // Upload to Cloudinary
//       const result = await cloudinary.uploader.upload(req.file.path, {
//         folder: "rental_documents",
//       });

//       const tenant = await User.findOne({ _id: req.userId });
//       if (!tenant)
//         return res.status(404).json({ message: "Profile not found" });

//       // Ensure documents array exists
//       if (!tenant.documents) tenant.documents = [];

//       // Check if document already exists
//       const existingDocIndex = tenant.documents.findIndex(
//         (doc) => doc.docName.toLowerCase() === docName.toLowerCase()
//       );

//       if (existingDocIndex > -1) {
//         // Update existing document URL
//         tenant.documents[existingDocIndex].url = result.secure_url;
//       } else {
//         // Add new document
//         tenant.documents.push({ docName, url: result.secure_url });
//       }

//       await tenant.save();

//       res.json({
//         message: "Document uploaded successfully",
//         documents: tenant.documents,
//       });
//     } catch (err) {
//       console.error("Error uploading document:", err);
//       res.status(500).json({ message: "Server error" });
//     }
//   },
// ];

// get all documents
// exports.getTenantDocuments = async (req, res) => {
//   try {
//     const documentId = req.params.id;
//     const document = await Document.findById(documentId);

//     if (!document) {
//       return res.status(404).json({ message: "Document not found" });
//     }

//     // Redirect user to Cloudinary file
//     return res.redirect(document.filePath);
//   } catch (error) {
//     res.status(500).json({
//       message: "Error viewing document",
//       error: error.message,
//     });
//   }
// };


// ✅ Get all documents of a tenant by ID
exports.getTenantDocuments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Tenant ID is required" });
    }

    const tenant = await User.findById(id).select("documents name email");
    if (!tenant) {
      return res.status(404).json({ message: "Tenant not found" });
    }

    return res.status(200).json({
      message: "Documents fetched successfully",
      tenant: {
        id: tenant._id,
        name: tenant.name,
        email: tenant.email,
      },
      documents: tenant.documents || [],
    });
  } catch (err) {
    console.error("Error fetching tenant documents:", err);
    res.status(500).json({ message: "Server error" });
  }
};

/**
 * ➡️ Upload Video Intro
 * POST /api/tenant/:id/upload-video
 */
exports.uploadVideoIntro = [
  upload.single("video"), // multer middleware
  async (req, res) => {
    try {
      const tenantId = req.params.id;
      const user = await User.findById(tenantId);

      if (!user) {
        return res.status(404).json({ message: "Tenant not found" });
      }

      if (!req.file) {
        return res.status(400).json({ message: "Video file is required" });
      }

      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "tenant_video",
        resource_type: "video" // important for videos
      });

      // Remove local file after upload
      fs.unlinkSync(req.file.path);

      // Save the video URL to user's documents array
      if (!user.documents) user.documents = [];
      user.documents.push({
        docName: "Video Intro",
        url: result.secure_url
      });

      // Optional: also save in videoIntro field
      user.videoIntro = result.secure_url;

      await user.save();

      res.json({
        message: "Video intro uploaded successfully",
        videoUrl: result.secure_url
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message });
    }
  },
];

// 6. Get daily applications
exports.getDailyApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const tenant = await Tenant.findById(id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });
    res.json(tenant.dailyApplications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 7. Update daily applications
exports.updateDailyApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const DAILY_LIMIT = 10; // set your daily application limit

    const tenant = await User.findById(id);
    if (!tenant) return res.status(404).json({ message: "Tenant not found" });

    // Count today's scheduled visits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const scheduledCount = await VisitRequest.countDocuments({
      tenantId: id,
      status: "accepted", // only count accepted visits
      "schedule.date": { $gte: today, $lt: tomorrow }, // only today's visits
    });

    // Update tenant.dailyApplications
    tenant.dailyApplications.submitted = scheduledCount;
    tenant.dailyApplications.remaining = Math.max(DAILY_LIMIT - scheduledCount, 0);

    await tenant.save();

    res.json({
      dailyLimit: DAILY_LIMIT,
      submitted: tenant.dailyApplications.submitted,
      remaining: tenant.dailyApplications.remaining,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

