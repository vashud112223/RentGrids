const express = require("express");
const {authMiddleware} = require("../middleware/authMiddleware");
const {
  createSchedule,
  getTenantSchedules,
  getOwnerSchedules,
  updateScheduleStatus,
  deleteSchedule
} = require("../controllers/scheduleController");

const scheduleRouter = express.Router();

scheduleRouter.post("/schedules", authMiddleware, createSchedule);              // tenant books visit
scheduleRouter.get("/schedules/tenant", authMiddleware, getTenantSchedules);    // tenant's schedules
scheduleRouter.get("/schedules/owner", authMiddleware, getOwnerSchedules);      // owner's schedules
scheduleRouter.patch("/schedules/:scheduleId/status", authMiddleware, updateScheduleStatus);
scheduleRouter.delete("/schedules/:scheduleId", authMiddleware, deleteSchedule);

module.exports = scheduleRouter;
