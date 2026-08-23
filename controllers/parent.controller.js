const { Parent, Student, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// @desc    Get all parents
// @route   GET /api/parents
// @access  Private
const getParents = async (req, res) => {
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
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Parent.findAndCountAll({
      where,
      include: [
        {
          model: Student,
          as: "Students",
          attributes: ["id", "student_id", "first_name", "last_name"],
        },
      ],
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
    console.error("Get parents error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single parent
// @route   GET /api/parents/:id
// @access  Private
const getParent = async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id, {
      include: [
        { model: Student, as: "Students" },
        { model: User, as: "User", attributes: { exclude: ["password"] } },
      ],
    });

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    res.json({ success: true, data: parent });
  } catch (error) {
    console.error("Get parent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create parent
// @route   POST /api/parents
// @access  Private
const createParent = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      relationship,
      phone,
      email,
      address,
      occupation,
      create_user,
    } = req.body;

    let userId = null;

    if (create_user && email) {
      const username = email.split("@")[0];
      const user = await User.create({
        username,
        email,
        password: "parent123",
        role: "parent",
        full_name: `${first_name} ${last_name}`,
        phone,
      });
      userId = user.id;
    }

    const parent = await Parent.create({
      user_id: userId,
      first_name,
      last_name,
      relationship,
      phone,
      email,
      address,
      occupation,
      photo: req.file ? req.file.filename : null,
    });

    res.status(201).json({ success: true, data: parent });
  } catch (error) {
    console.error("Create parent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update parent
// @route   PUT /api/parents/:id
// @access  Private
const updateParent = async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id);

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const updateData = { ...req.body };
    // Remove photo if not a string (frontend may send empty object)
    if (updateData.photo != null && typeof updateData.photo !== "string") {
      delete updateData.photo;
    }
    if (req.body.remove_photo === "true" && !req.file && parent.photo) {
      const oldPhotoPath = path.join(__dirname, "../uploads", parent.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      updateData.photo = null;
    }
    if (req.file) {
      // Delete old photo if exists
      if (parent.photo) {
        const oldPhotoPath = path.join(__dirname, "../uploads", parent.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = req.file.filename;
    }

    await parent.update(updateData);

    res.json({ success: true, data: parent });
  } catch (error) {
    console.error("Update parent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete parent
// @route   DELETE /api/parents/:id
// @access  Private
const deleteParent = async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id);

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (parent.user_id) {
      await User.destroy({ where: { id: parent.user_id } });
    }

    // Delete photo file if exists
    if (parent.photo) {
      const photoPath = path.join(__dirname, "../uploads", parent.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await parent.destroy();

    res.json({ success: true, message: "Parent deleted successfully" });
  } catch (error) {
    console.error("Delete parent error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete parent photo
// @route   DELETE /api/parents/:id/photo
// @access  Private
const deleteParentPhoto = async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.params.id);

    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    if (parent.photo) {
      const photoPath = path.join(__dirname, "../uploads", parent.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await parent.update({ photo: null });

    res.json({
      success: true,
      message: "Photo deleted successfully",
      data: parent,
    });
  } catch (error) {
    console.error("Delete parent photo error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getParents,
  getParent,
  createParent,
  updateParent,
  deleteParent,
  deleteParentPhoto,
};
