const User = require("../models/User");
const Notification = require("../models/Notification");

const sanitizeUser = (user) => ({
  _id: user._id,
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  studentId: user.studentId,
  phone: user.phone,
  gender: user.gender || "",
  address: user.address
});

exports.getMe = (req, res) => {
  res.json({ user: sanitizeUser(req.user) });
};

exports.updateMe = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.gender !== undefined) updates.gender = req.body.gender || undefined;
    if (req.body.address !== undefined) updates.address = req.body.address;

    const user = await User.findByIdAndUpdate(req.user.id, updates, {
      new: true
    }).select("-password");

    res.json({ user: sanitizeUser(user) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createGenderSeatAlert = async (req, res) => {
  try {
    const { selectedSeatId, adjacentSeatId } = req.body || {};
    const normalizedSelectedSeatId = String(selectedSeatId || "").trim().toUpperCase();
    const normalizedAdjacentSeatId = String(adjacentSeatId || "").trim().toUpperCase();

    const actorGender = (req.user.gender || "").toLowerCase();
    const recipientGender = actorGender === "male" ? "female" : "";

    if (!recipientGender) {
      // Female-next-to-male warnings should not trigger account notifications.
      return res.json({ created: 0 });
    }

    const recipients = await User.find({
      role: "student",
      gender: recipientGender,
      _id: { $ne: req.user.id }
    }).select("_id gender");

    if (!recipients.length) {
      return res.json({ created: 0 });
    }

    const actorName = req.user.name || "A user";

    let created = 0;

    for (const recipient of recipients) {
      const existingUnread = await Notification.findOne({
        recipientUserId: recipient._id,
        type: "gender-seat-alert",
        isRead: false,
        "metadata.selectedSeatId": normalizedSelectedSeatId,
        "metadata.adjacentSeatId": normalizedAdjacentSeatId
      });

      const payload = {
        message: `${actorName} booked seat ${normalizedSelectedSeatId || "N/A"} next to your seat ${normalizedAdjacentSeatId || "N/A"}. You can change your seat if you prefer.`,
        recipientUserId: recipient._id,
        createdByUserId: req.user.id,
        type: "gender-seat-alert",
        metadata: {
          selectedSeatId: normalizedSelectedSeatId,
          adjacentSeatId: normalizedAdjacentSeatId,
          canChangeSeat: String(recipient.gender || "").toLowerCase() === "female",
          actionLabel: "Change seat",
          secondaryActionLabel: "I prefer this seat",
          redirectTo: "/"
        }
      };

      if (existingUnread) {
        await Notification.findByIdAndUpdate(existingUnread._id, payload);
      } else {
        await Notification.create(payload);
        created += 1;
      }
    }

    res.status(201).json({ created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientUserId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    res.json({ notifications });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const existing = await Notification.findOne({
      _id: req.params.id,
      recipientUserId: req.user.id
    }).lean();

    if (!existing) {
      return res.status(404).json({ error: "Notification not found" });
    }

    const updatePayload = { isRead: true };

    if (existing.type === "gender-seat-alert") {
      updatePayload.metadata = {
        selectedSeatId: existing?.metadata?.selectedSeatId || "",
        adjacentSeatId: existing?.metadata?.adjacentSeatId || "",
        canChangeSeat: false,
        actionLabel: "",
        secondaryActionLabel: "",
        redirectTo: existing?.metadata?.redirectTo || "/"
      };
    }

    const updated = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientUserId: req.user.id },
      updatePayload,
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ error: "Notification not found" });
    }

    res.json({ notification: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.clearMyNotifications = async (req, res) => {
  try {
    const result = await Notification.deleteMany({ recipientUserId: req.user.id });
    res.json({ cleared: result?.deletedCount || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password").lean();
    const studentIds = students.map((student) => student._id);

    const [notificationTotals, latestNotifications] = await Promise.all([
      Notification.aggregate([
        {
          $match: {
            recipientUserId: { $in: studentIds }
          }
        },
        {
          $group: {
            _id: "$recipientUserId",
            total: { $sum: 1 },
            unread: {
              $sum: {
                $cond: [{ $eq: ["$isRead", false] }, 1, 0]
              }
            }
          }
        }
      ]),
      Notification.aggregate([
        {
          $match: {
            recipientUserId: { $in: studentIds }
          }
        },
        { $sort: { createdAt: -1 } },
        {
          $group: {
            _id: "$recipientUserId",
            latestMessage: { $first: "$message" },
            latestAt: { $first: "$createdAt" }
          }
        }
      ])
    ]);

    const totalsByRecipient = new Map(
      notificationTotals.map((item) => [String(item._id), item])
    );
    const latestByRecipient = new Map(
      latestNotifications.map((item) => [String(item._id), item])
    );

    const payload = students.map((student) => {
      const studentId = String(student._id);
      const totals = totalsByRecipient.get(studentId);
      const latest = latestByRecipient.get(studentId);

      return {
        ...sanitizeUser(student),
        notificationCount: totals?.total || 0,
        unreadNotificationCount: totals?.unread || 0,
        latestNotificationMessage: latest?.latestMessage || "",
        latestNotificationAt: latest?.latestAt || null
      };
    });

    res.json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createStudent = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const student = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || "",
      address: address || "",
      role: "student"
    });

    res.status(201).json(sanitizeUser(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email.toLowerCase();
    if (req.body.phone !== undefined) updates.phone = req.body.phone;
    if (req.body.address !== undefined) updates.address = req.body.address;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: "student" },
      updates,
      { new: true }
    ).select("-password");

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    res.json(sanitizeUser(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteStudent = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ _id: req.params.id, role: "student" });
    if (!deleted) {
      return res.status(404).json({ error: "Student not found" });
    }
    res.json({ message: "Student removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.json(admins.map(sanitizeUser));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required" });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: "Email already registered" });
    }

    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: "admin"
    });

    res.status(201).json(sanitizeUser(admin));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateAdmin = async (req, res) => {
  try {
    const updates = {};
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.email !== undefined) updates.email = req.body.email.toLowerCase();
    if (req.body.password !== undefined) {
      // Password will be hashed by pre-save middleware
      updates.password = req.body.password;
    }

    const admin = await User.findOneAndUpdate(
      { _id: req.params.id, role: "admin" },
      updates,
      { new: true }
    ).select("-password");

    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json(sanitizeUser(admin));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteAdmin = async (req, res) => {
  try {
    const deleted = await User.findOneAndDelete({ _id: req.params.id, role: "admin" });
    if (!deleted) {
      return res.status(404).json({ error: "Admin not found" });
    }
    res.json({ message: "Admin removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
