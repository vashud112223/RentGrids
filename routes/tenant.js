// routes/tenant.js
const tenantDashboardRouter = require("express").Router();
const {authMiddleware} = require("../middleware/authMiddleware");
const c = require("../controllers/tenantDashboardController");

// tenant-facing
tenantDashboardRouter.get("/tenant/summary", authMiddleware, c.getSummary);
tenantDashboardRouter.get("/tenant/requests", authMiddleware, c.getRequestsByStatus);
tenantDashboardRouter.get("/tenant/requests/:propertyId/status", authMiddleware, c.getRequestStatusForProperty);
tenantDashboardRouter.post("/tenant/requests", authMiddleware, c.createVisitRequest);
tenantDashboardRouter.post("/tenant/requests/:id/reapply", authMiddleware, c.reapply);
tenantDashboardRouter.get("/tenant/scheduled", authMiddleware, c.getScheduled);
tenantDashboardRouter.get("/tenant/saved", authMiddleware, c.getSaved);
tenantDashboardRouter.post("/tenant/saved", authMiddleware, c.saveProperty);
tenantDashboardRouter.delete("/tenant/saved/:propertyId", authMiddleware, c.unsaveProperty);
// landlord actions
tenantDashboardRouter.patch("/landlord/requests/:id", authMiddleware, c.landlordAct);
// similar listings
tenantDashboardRouter.get("/properties/:id/similar", authMiddleware, c.getSimilar);

module.exports = {tenantDashboardRouter};
