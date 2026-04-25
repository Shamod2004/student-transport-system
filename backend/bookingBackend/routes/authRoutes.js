const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const { requireAuth } = require("../middleware/auth");
const { getMe } = require("../controllers/userController");

router.post("/register", controller.register);
router.post("/login", controller.login);
router.post("/admin/login", controller.adminLogin);
router.post("/route-admin/login", controller.routeAdminLogin);
router.post("/driver-maintenance/login", controller.driverMaintenanceLogin);
router.get("/route-admin/me", requireAuth, controller.getRouteAdminMe);
router.get("/me", requireAuth, getMe);

module.exports = router;

