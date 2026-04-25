const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { requireAuth, requireRole } = require("../middleware/auth");

router.get("/me", requireAuth, controller.getMe);
router.put("/me", requireAuth, controller.updateMe);
router.post("/notifications/gender-seat-alert", requireAuth, controller.createGenderSeatAlert);
router.get("/notifications", requireAuth, controller.getMyNotifications);
router.put("/notifications/:id/read", requireAuth, controller.markNotificationRead);
router.delete("/notifications", requireAuth, controller.clearMyNotifications);

router.get("/students", requireAuth, requireRole("admin"), controller.getStudents);
router.post("/students", requireAuth, requireRole("admin"), controller.createStudent);
router.put("/students/:id", requireAuth, requireRole("admin"), controller.updateStudent);
router.delete("/students/:id", requireAuth, requireRole("admin"), controller.deleteStudent);

router.get("/admins", requireAuth, requireRole("admin"), controller.getAdmins);
router.post("/admins", requireAuth, requireRole("admin"), controller.createAdmin);
router.put("/admins/:id", requireAuth, requireRole("admin"), controller.updateAdmin);
router.delete("/admins/:id", requireAuth, requireRole("admin"), controller.deleteAdmin);

module.exports = router;
