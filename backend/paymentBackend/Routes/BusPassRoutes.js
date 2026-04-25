const express = require("express");
const router = express.Router();

const BusPassController = require("../Controllers/BusPassControllers");

// GET all bus passes
router.get("/", BusPassController.getAllBusPasses);

// CREATE new bus pass
router.post("/", BusPassController.addBusPass);

// GET bus pass by ID
router.get("/:id", BusPassController.getBusPassById);

// UPDATE bus pass by ID
router.put("/:id", BusPassController.updateBusPass);

// DELETE bus pass by ID
router.delete("/:id", BusPassController.deleteBusPass);

module.exports = router;
