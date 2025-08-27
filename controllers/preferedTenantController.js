const PreferredTenant = require("../models/PreferedTenant");

// CREATE - Add Preferred Tenant
const createPreferredTenant = async (req, res) => {
  try {
    const { propertyId, tenantTypes, notes } = req.body;

    if (!propertyId || !tenantTypes || tenantTypes.length === 0) {
      return res.status(400).json({ success: false, message: "Property and tenantTypes are required" });
    }

    const preferredTenant = new PreferredTenant({
      ownerId: req.userId, // from auth middleware
      propertyId,
      tenantTypes,
      notes
    });

    await preferredTenant.save();

    res.status(201).json({
      success: true,
      message: "Preferred tenant created successfully",
      data: preferredTenant
    });
  } catch (error) {
    console.error("Error creating preferred tenant:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET - All Preferred Tenants (for an owner or property)
const getPreferredTenants = async (req, res) => {
  try {
    const { propertyId } = req.query;

    let filter = { ownerId: req.userId }; // only fetch for logged-in owner
    if (propertyId) filter.propertyId = propertyId;

    const tenants = await PreferredTenant.find(filter)
      .populate("propertyId", "title city locality")
      .populate("ownerId", "name email");

    res.status(200).json({ success: true, data: tenants });
  } catch (error) {
    console.error("Error fetching preferred tenants:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE - Preferred Tenant
const updatePreferredTenant = async (req, res) => {
  try {
    const { id } = req.params; // preferred tenant ID
    const { tenantTypes, notes } = req.body;

    const updated = await PreferredTenant.findOneAndUpdate(
      { _id: id, ownerId: req.userId }, // owner can only update their own
      { $set: { tenantTypes, notes } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: "Preferred tenant not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Preferred tenant updated", data: updated });
  } catch (error) {
    console.error("Error updating preferred tenant:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE - Preferred Tenant
const deletePreferredTenant = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await PreferredTenant.findOneAndDelete({
      _id: id,
      ownerId: req.userId
    });

    if (!deleted) {
      return res.status(404).json({ success: false, message: "Preferred tenant not found or unauthorized" });
    }

    res.status(200).json({ success: true, message: "Preferred tenant deleted successfully" });
  } catch (error) {
    console.error("Error deleting preferred tenant:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createPreferredTenant,
  getPreferredTenants,
  updatePreferredTenant,
  deletePreferredTenant
};
