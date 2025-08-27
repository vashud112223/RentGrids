const Schedule = require("../models/Schedule");
const Property = require("../models/Property");

// CREATE - Book a new schedule (Tenant books property visit)
// const Schedule = require("../models/Schedule");
// const Property = require("../models/Property");
const User = require("../models/User"); // assuming you have this

// Get all tenants for a particular property pid

const getSortedTenantsForProperty = async (req, res) => {
  try {
    const { pid } = req.params;

    // Find property by pid
    const property = await Property.findOne({ pid });
    if (!property) {
      return res.status(404).json({ success: false, message: "Property not found" });
    }

    // Get preferred tenant rules for this property
    const preferred = await PreferredTenant.findOne({ property: property._id });
    if (!preferred) {
      return res.status(404).json({
        success: false,
        message: "Preferred tenant rules not set for this property"
      });
    }

    // Get all schedules with tenant details
    const schedules = await Schedule.find({ property: property._id })
      .populate("tenant", "fullName emailId phoneNumber gender profession maritalStatus age");

    if (!schedules.length) {
      return res.status(200).json({
        success: true,
        message: "No tenants have scheduled visits",
        data: []
      });
    }

    // Calculate match score for each tenant
    const scoredTenants = schedules.map((s) => {
      const tenant = s.tenant;
      let score = 0;

      if (!tenant) return null;

      // Example scoring rules
      if (preferred.gender && tenant.gender === preferred.gender) score += 2;
      if (preferred.profession && tenant.profession === preferred.profession) score += 2;
      if (preferred.maritalStatus && tenant.maritalStatus === preferred.maritalStatus) score += 1;

      // Age range check
      if (preferred.ageRange && tenant.age) {
        const [minAge, maxAge] = preferred.ageRange;
        if (tenant.age >= minAge && tenant.age <= maxAge) score += 2;
      }

      return {
        tenant,
        scheduleDate: s.date,
        scheduleTime: s.time,
        score
      };
    }).filter(Boolean);

    // Sort by score (highest first)
    scoredTenants.sort((a, b) => b.score - a.score);

    res.status(200).json({
      success: true,
      property: { pid: property.pid, title: property.title },
      totalTenants: scoredTenants.length,
      data: scoredTenants
    });
  } catch (error) {
    console.error("Error fetching sorted tenants:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// module.exports = {  };

const getTenantsForProperty = async (req, res) => {
  try {
    const { pid } = req.params;

    // 1. Find property by pid
    const property = await Property.findOne({ pid });
    if (!property) {
      return res.status(404).json({
        success: false,
        message: "Property not found"
      });
    }

    // 2. Fetch schedules for this property and populate tenant details
    const schedules = await Schedule.find({ property: property._id })
      .populate("tenant", "fullName emailId phoneNumber")
      .sort({ date: 1 });

    if (!schedules.length) {
      return res.status(200).json({
        success: true,
        message: "No tenants have scheduled visits for this property yet",
        data: []
      });
    }

    // 3. Extract tenant info (remove duplicates if tenant scheduled multiple times)
    const tenantsMap = new Map();
    schedules.forEach((s) => {
      if (s.tenant) {
        tenantsMap.set(s.tenant._id.toString(), s.tenant);
      }
    });

    const tenants = Array.from(tenantsMap.values());

    res.status(200).json({
      success: true,
      property: { pid: property.pid, title: property.title },
      totalTenants: tenants.length,
      data: tenants
    });
  } catch (error) {
    console.error("Error fetching tenants for property:", error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

// module.exports = {  };



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
  deleteSchedule,
  getTenantsForProperty,
  getSortedTenantsForProperty
};
