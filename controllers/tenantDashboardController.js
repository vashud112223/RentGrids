// controllers/tenantDashboard.controller.js
const VisitRequest = require("../models/VisitRequest");
const SavedProperty = require("../models/SavedProperty");
const Property = require("../models/Property");
const User = require("../models/User");

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
    const lMap = Object.fromEntries(landlords.map((u) => [u._id.toString(), u]));

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
    doc.status = "accepted";
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
