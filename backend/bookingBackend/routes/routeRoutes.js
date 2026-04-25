const express = require("express");
const router = express.Router();
const routeController = require("../controllers/routeController");

router.get("/", routeController.getAllRoutes);
router.get("/locations", routeController.getUniqueLocations);
router.get("/schedule", routeController.getScheduleByDate);
router.get("/:routeName/buses", routeController.getBusesByRoute);
router.get("/:id", routeController.getRouteById);
router.post("/", routeController.createRoute);
router.put("/:id", routeController.updateRoute);
router.put("/:id/status", routeController.updateRouteStatus);
router.delete("/:id", routeController.deleteRoute);

module.exports = router;