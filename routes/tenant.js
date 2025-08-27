// routes/tenant.js
const tenantDashboardRouter = require("express").Router();
const { authMiddleware } = require("../middleware/authMiddleware");
const c = require("../controllers/tenantDashboardController");
const upload = require("../middleware/upload");

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

// tenant profile management
tenantDashboardRouter.patch("/tenant/personal-details", authMiddleware, c.updatePersonalDetails);
// tenantDashboardRouter.post("/tenant/:id/personal-details", authMiddleware, c.addPersonalDetails);
tenantDashboardRouter.put("/tenant/property-preferences", authMiddleware, c.updatePropertyPreferences);
tenantDashboardRouter.put("/tenant/preferences", authMiddleware, c.updatePreferences);
tenantDashboardRouter.put("/tenant/rental-history", authMiddleware, c.updateRentalHistory);
// tenantDashboardRouter.post("/tenant/rental-docs", authMiddleware, upload.single("file"), c.uploadRentalDocument);
tenantDashboardRouter.get("/tenant/view-documents", authMiddleware, c.getTenantDocuments);
tenantDashboardRouter.post("/tenant/video-intro", authMiddleware, c.uploadVideoIntro);
tenantDashboardRouter.get("/tenant/:id/daily-applications", authMiddleware, c.getDailyApplications);
tenantDashboardRouter.patch("/tenant/:id/daily-applications", authMiddleware, c.updateDailyApplications);


module.exports = { tenantDashboardRouter };
