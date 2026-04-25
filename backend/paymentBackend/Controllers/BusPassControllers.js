const BusPass = require("../Model/BusPassModel");

// Get All Bus Passes
const getAllBusPasses = async (req, res) => {
  try {
    const busPasses = await BusPass.find();

    if (!busPasses || busPasses.length === 0) {
      return res.status(404).json({ message: "No bus passes found" });
    }

    return res.status(200).json({ busPasses });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Fetching bus passes failed" });
  }
};

// Add Bus Pass
const addBusPass = async (req, res) => {
  const { studentId, studentName, travelRoute, startDate, validityPeriod, paymentMade } = req.body;

  try {
    const busPass = new BusPass({ studentId, studentName, travelRoute, startDate, validityPeriod, paymentMade });
    await busPass.save();

    return res.status(201).json({ busPass });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Unable to add bus pass" });
  }
};

// Get Bus Pass By ID
const getBusPassById = async (req, res) => {
  const id = req.params.id;

  try {
    const busPass = await BusPass.findById(id);

    if (!busPass) {
      return res.status(404).json({ message: "Bus pass not found" });
    }

    return res.status(200).json({ busPass });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error fetching bus pass" });
  }
};

// Update Bus Pass by ID
const updateBusPass = async (req, res) => {
  const id = req.params.id;
  const updates = req.body;

  try {
    const busPass = await BusPass.findByIdAndUpdate(id, updates, { new: true });

    if (!busPass) {
      return res.status(404).json({ message: "Bus pass not found" });
    }

    return res.status(200).json({ busPass });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error updating bus pass" });
  }
};

// Delete Bus Pass by ID
const deleteBusPass = async (req, res) => {
  const id = req.params.id;

  try {
    const busPass = await BusPass.findByIdAndDelete(id);

    if (!busPass) {
      return res.status(404).json({ message: "Bus pass not found" });
    }

    return res.status(200).json({ message: "Bus pass deleted successfully" });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Error deleting bus pass" });
  }
};

module.exports = {
  getAllBusPasses,
  addBusPass,
  getBusPassById,
  updateBusPass,
  deleteBusPass,
};
