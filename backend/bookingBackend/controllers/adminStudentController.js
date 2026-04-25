const Student = require("../models/Student");

// GET all students
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET single student
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// CREATE student
exports.createStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, studentId, phone, gender, dateOfBirth, address, major, yearLevel } = req.body;

    if (!firstName || !lastName || !email || !studentId) {
      return res.status(400).json({ error: "First name, last name, email, and student ID are required" });
    }

    const existingEmail = await Student.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(409).json({ error: "Email already exists" });
    }

    const existingId = await Student.findOne({ studentId });
    if (existingId) {
      return res.status(409).json({ error: "Student ID already exists" });
    }

    const student = await Student.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      studentId,
      phone: phone || "",
      gender: gender || undefined,
      dateOfBirth: dateOfBirth || null,
      address: address || "",
      major: major || "",
      yearLevel: yearLevel || "",
      registeredBy: req.admin?.id || "admin-001"
    });

    res.status(201).json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE student
exports.updateStudent = async (req, res) => {
  try {
    const { firstName, lastName, email, studentId, phone, gender, dateOfBirth, address, major, yearLevel, status } = req.body;
    
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    // Check if email is being changed and if new email exists
    if (email && email !== student.email) {
      const existingEmail = await Student.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(409).json({ error: "Email already exists" });
      }
    }

    // Check if studentId is being changed and if new ID exists
    if (studentId && studentId !== student.studentId) {
      const existingId = await Student.findOne({ studentId });
      if (existingId) {
        return res.status(409).json({ error: "Student ID already exists" });
      }
    }

    if (firstName !== undefined) student.firstName = firstName;
    if (lastName !== undefined) student.lastName = lastName;
    if (email !== undefined) student.email = email.toLowerCase();
    if (studentId !== undefined) student.studentId = studentId;
    if (phone !== undefined) student.phone = phone;
    if (gender !== undefined) student.gender = gender || undefined;
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (address !== undefined) student.address = address;
    if (major !== undefined) student.major = major;
    if (yearLevel !== undefined) student.yearLevel = yearLevel;
    if (status !== undefined) student.status = status;

    await student.save();
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE student
exports.deleteStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndDelete(req.params.id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// SEARCH students
exports.searchStudents = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: "Search term is required" });
    }

    const students = await Student.find({
      $or: [
        { firstName: { $regex: q, $options: "i" } },
        { lastName: { $regex: q, $options: "i" } },
        { email: { $regex: q, $options: "i" } },
        { studentId: { $regex: q, $options: "i" } },
        { gender: { $regex: q, $options: "i" } }
      ]
    });

    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
