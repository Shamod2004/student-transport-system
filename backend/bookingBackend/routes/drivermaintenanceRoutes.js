
const express = require("express");
const router = express.Router();
const controller = require("../controllers/driverMaintenanceController");

router.get("/drivers", controller.getDrivers);
router.get("/drivers/:id", controller.getDriverById);
router.post("/drivers", controller.createDriver);
router.put("/drivers/:id", controller.updateDriver);
router.delete("/drivers/:id", controller.deleteDriver);

router.get("/buses", controller.getBuses);

router.get("/maintenance", controller.getMaintenanceRecords);
router.get("/maintenance/:id", controller.getMaintenanceRecordById);
router.post("/maintenance", controller.createMaintenanceRecord);
router.put("/maintenance/:id", controller.updateMaintenanceRecord);
router.delete("/maintenance/:id", controller.deleteMaintenanceRecord);

module.exports = router;