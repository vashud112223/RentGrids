const express = require("express");
const {
  createPreferredTenant,
  getPreferredTenants,
  updatePreferredTenant,
  deletePreferredTenant
} = require("../controllers/preferedTenantController");

const { authMiddleware } = require("../middleware/authMiddleware");

const preferredTenantRouter = express.Router();

preferredTenantRouter.post("/preferred-tenants", authMiddleware, createPreferredTenant);
preferredTenantRouter.get("/preferred-tenants", authMiddleware, getPreferredTenants);
preferredTenantRouter.put("/preferred-tenants/:id", authMiddleware, updatePreferredTenant);
preferredTenantRouter.delete("/preferred-tenants/:id", authMiddleware, deletePreferredTenant);

module.exports = { preferredTenantRouter };
