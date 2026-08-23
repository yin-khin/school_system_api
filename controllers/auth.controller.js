const jwt = require("jsonwebtoken");
const { User, Student, Teacher, Parent, Staff } = require("../models");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
};

// @desc    Login user (by email + password)
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide email and password" });
    }

    // Find user by email only
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (user.status !== "active") {
      return res
        .status(403)
        .json({
          message: "Account is not active. Please contact administrator.",
        });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Get profile based on role
    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ where: { user_id: user.id } });
    } else if (user.role === "teacher") {
      profile = await Teacher.findOne({ where: { user_id: user.id } });
    } else if (user.role === "parent") {
      profile = await Parent.findOne({
        where: { user_id: user.id },
        include: [{ model: Student, as: "Students" }],
      });
    } else if (
      user.role === "staff" ||
      user.role === "admin" ||
      user.role === "accountant" ||
      user.role === "librarian"
    ) {
      profile = await Staff.findOne({ where: { user_id: user.id } });
    }

    res.json({
      success: true,
      token: generateToken(user.id),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        status: user.status,
        profile,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password"] },
    });

    let profile = null;
    if (user.role === "student") {
      profile = await Student.findOne({ where: { user_id: user.id } });
    } else if (user.role === "teacher") {
      profile = await Teacher.findOne({ where: { user_id: user.id } });
    } else if (user.role === "parent") {
      profile = await Parent.findOne({
        where: { user_id: user.id },
        include: [{ model: Student, as: "Students" }],
      });
    } else if (
      user.role === "staff" ||
      user.role === "admin" ||
      user.role === "accountant" ||
      user.role === "librarian"
    ) {
      profile = await Staff.findOne({ where: { user_id: user.id } });
    }

    res.json({
      success: true,
      user: { ...user.toJSON(), profile },
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Please provide current and new password" });
    }

    const user = await User.findByPk(req.user.id);

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ message: "New password must be at least 6 characters" });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = { login, getMe, logout, changePassword };
