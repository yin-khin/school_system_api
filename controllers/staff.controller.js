const { Staff, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// @desc    Get all staff
// @route   GET /api/staffs
// @access  Private
const getStaffs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";

    const where = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { staff_id: { [Op.iLike]: `%${search}%` } },
        { position: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Staff.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Get staffs error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single staff
// @route   GET /api/staffs/:id
// @access  Private
const getStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id, {
      include: [
        { model: User, as: "User", attributes: { exclude: ["password"] } },
      ],
    });

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create staff
// @route   POST /api/staffs
// @access  Private
const createStaff = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      position,
      department,
      phone,
      email,
      address,
      joining_date,
      salary,
      create_user,
    } = req.body;

    const year = new Date().getFullYear();
    const count = await Staff.count();
    const staffId = `STF-${year}-${String(count + 1).padStart(3, "0")}`;

    let userId = null;

    if (create_user && email) {
      const username = email.split("@")[0];
      const user = await User.create({
        username,
        email,
        password: "staff123",
        role: "staff",
        full_name: `${first_name} ${last_name}`,
        phone,
      });
      userId = user.id;
    }

    const staff = await Staff.create({
      staff_id: staffId,
      user_id: userId,
      first_name,
      last_name,
      gender,
      position,
      department,
      phone,
      email,
      address,
      joining_date,
      salary,
      photo: req.file ? req.file.filename : null,
    });

    res.status(201).json({ success: true, data: staff });
  } catch (error) {
    console.error("Create staff error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update staff
// @route   PUT /api/staffs/:id
// @access  Private
const updateStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    const updateData = { ...req.body };
    // Remove photo if not a string (frontend may send empty object)
    if (updateData.photo != null && typeof updateData.photo !== "string") {
      delete updateData.photo;
    }
    if (req.body.remove_photo === "true" && !req.file && staff.photo) {
      const oldPhotoPath = path.join(__dirname, "../uploads", staff.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      updateData.photo = null;
    }
    if (req.file) {
      // Delete old photo if exists
      if (staff.photo) {
        const oldPhotoPath = path.join(__dirname, "../uploads", staff.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = req.file.filename;
    }

    await staff.update(updateData);

    res.json({ success: true, data: staff });
  } catch (error) {
    console.error("Update staff error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete staff
// @route   DELETE /api/staffs/:id
// @access  Private
const deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.user_id) {
      await User.destroy({ where: { id: staff.user_id } });
    }

    // Delete photo file if exists
    if (staff.photo) {
      const photoPath = path.join(__dirname, "../uploads", staff.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await staff.destroy();

    res.json({ success: true, message: "Staff deleted successfully" });
  } catch (error) {
    console.error("Delete staff error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete staff photo
// @route   DELETE /api/staffs/:id/photo
// @access  Private
const deleteStaffPhoto = async (req, res) => {
  try {
    const staff = await Staff.findByPk(req.params.id);

    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    if (staff.photo) {
      const photoPath = path.join(__dirname, "../uploads", staff.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await staff.update({ photo: null });

    res.json({
      success: true,
      message: "Photo deleted successfully",
      data: staff,
    });
  } catch (error) {
    console.error("Delete staff photo error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getStaffs,
  getStaff,
  createStaff,
  updateStaff,
  deleteStaff,
  deleteStaffPhoto,
};
