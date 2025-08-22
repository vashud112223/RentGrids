const Schedule = require("../models/Schedule");
const Property = require("../models/Property");

// CREATE - Book a new schedule (Tenant books property visit)
// const Schedule = require("../models/Schedule");
// const Property = require("../models/Property");
const User = require("../models/User"); // assuming you have this

const createSchedule = async (req, res) => {
  try {
    const { property, date, time } = req.body;

    // Ensure only tenant can create schedule
    // if (req.user.role !== "tenant") {
    //   return res.status(403).json({
    //     success: false,
    //     message: "Only tenants can create schedules"
    //   });
    // }
    // const tenant = User.findById(_id:req.userId);


    // Fetch tenant from DB to get subscription plan
    const tenant = await User.findById(req.user._id).populate("subscription");
    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found"
      });
    }

    // Get daily limit from subscription
    const dailyLimit = tenant.subscription?.dailyLimit || 10; // default fallback

    // Daily limit check
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const todayCount = await Schedule.countDocuments({
      tenant: req.userId,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (todayCount >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily schedule limit (${dailyLimit}) reached`
      });
    }

    // Ensure property exists
    const propertyDoc = await Property.findById(property).populate("ownerId");
    if (!propertyDoc) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // Create schedule
    const schedule = new Schedule({
      property,
      owner: propertyDoc.ownerId,
      tenant: req.user._id,
      date,
      time
    });

    await schedule.save();

    res.status(201).json({
      success: true,
      message: "Schedule created successfully",
      data: schedule
    });
  } catch (error) {
    console.error("Error creating schedule:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// GET - All schedules for a tenant
const getTenantSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ tenant: req.userId })
      .populate("property", "title city locality")
      .populate("owner", "fullName emailId phonenumber")
      .sort({ date: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error fetching tenant schedules:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// GET - All schedules for an owner (landlord)
const getOwnerSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find({ owner: req.userId })
      .populate("property", "title city locality")
      .populate("tenant", "fullName emailId phonenumber")
      .sort({ date: 1 });

    res.status(200).json({ success: true, data: schedules });
  } catch (error) {
    console.error("Error fetching owner schedules:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// UPDATE - Change status (confirm/cancel/complete)
const updateScheduleStatus = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    // Find the schedule
    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    // Check if current user is either tenant or owner
    if (
      schedule.tenant.toString() !== req.userId &&
      schedule.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this schedule"
      });
    }

    // Update status
    schedule.status = status;
    await schedule.save();

    res.status(200).json({ success: true, message: "Schedule updated", data: schedule });
  } catch (error) {
    console.error("Error updating schedule:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// DELETE - Cancel/Delete a schedule
const deleteSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ success: false, message: "Schedule not found" });
    }

    // Check if current user is either tenant or owner
    if (
      schedule.tenant.toString() !== req.userId &&
      schedule.owner.toString() !== req.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this schedule"
      });
    }

    await schedule.deleteOne();

    res.status(200).json({ success: true, message: "Schedule deleted successfully" });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  createSchedule,
  getTenantSchedules,
  getOwnerSchedules,
  updateScheduleStatus,
  deleteSchedule
};
