const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Student = require("../models/Student");

const createToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d"
  });

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  adminType: user.adminType,
  studentId: user.studentId,
  phone: user.phone,
  gender: user.gender || "",
  address: user.address
});

const splitName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

exports.register = async (req, res) => {
  try {
    const {
      name,
      firstName,
      lastName,
      email,
      password,
      phone,
      address,
      studentId,
      gender
    } = req.body;

    const fullName = name || `${firstName || ""} ${lastName || ""}`.trim();
    const derivedName = splitName(fullName);
    const studentFirstName = firstName || derivedName.firstName;
    const studentLastName = lastName || derivedName.lastName;

    if (!fullName || !email || !password || !studentId) {
      return res
        .status(400)
        .json({ error: "Name, email, password, and student ID are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const normalizedEmail = email.toLowerCase();

    const existingStudentEmail = await Student.findOne({ email: normalizedEmail });
    if (existingStudentEmail) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const existingStudentId = await Student.findOne({ studentId });
    if (existingStudentId) {
      return res.status(409).json({ error: "Student ID already registered" });
    }

    const user = await User.create({
      name: fullName,
      email: normalizedEmail,
      password,
      phone: phone || "",
      gender: gender || undefined,
      address: address || "",
      role: "student",
      studentId
    });

    try {
      await Student.create({
        firstName: studentFirstName || "Student",
        lastName: studentLastName || "",
        email: normalizedEmail,
        studentId,
        phone: phone || "",
        gender: gender || undefined,
        address: address || "",
        status: "active"
      });
    } catch (err) {
      await User.findByIdAndDelete(user._id);
      throw err;
    }

    const token = createToken(user);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = createToken(user);
    res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
      adminType: "general"
    });
    if (!user) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid admin credentials" });
    }

    const token = createToken(user);

    res.json({ token, admin: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.routeAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const routeAdmin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
      adminType: "route-management"
    });

    if (!routeAdmin) {
      return res.status(401).json({ error: "Invalid route admin credentials" });
    }

    const isMatch = await routeAdmin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid route admin credentials" });
    }

    const token = createToken(routeAdmin);
    const admin = sanitizeUser(routeAdmin);

    res.json({ token, admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getRouteAdminMe = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const isRouteAdmin =
      String(user.role || "").toLowerCase() === "admin" &&
      String(user.adminType || "").toLowerCase() === "route-management";

    if (!isRouteAdmin) {
      return res.status(403).json({ error: "Route admin access only" });
    }

    return res.json({ admin: sanitizeUser(user) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

exports.driverMaintenanceLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const maintenanceAdmin = await User.findOne({
      email: email.toLowerCase(),
      role: "admin",
      adminType: "driver-maintenance"
    });

    if (!maintenanceAdmin) {
      return res.status(401).json({ error: "Invalid maintenance admin credentials" });
    }

    const isMatch = await maintenanceAdmin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid maintenance admin credentials" });
    }

    const token = createToken(maintenanceAdmin);
    const admin = sanitizeUser(maintenanceAdmin);

    res.json({ token, admin });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

