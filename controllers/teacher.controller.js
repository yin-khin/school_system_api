const { Teacher, User, Class, Subject } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// @desc    Get all teachers
// @route   GET /api/teachers
// @access  Private
const getTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const status = req.query.status;

    const where = {};
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { teacher_id: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;

    const { count, rows } = await Teacher.findAndCountAll({
      where,
      include: [
        { model: Class, as: "Classes", attributes: ["id", "name", "code"] },
        { model: Subject, as: "Subjects", attributes: ["id", "name", "code"] },
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
    console.error("Get teachers error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Private
const getTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id, {
      include: [
        { model: Class, as: "Classes" },
        { model: Subject, as: "Subjects" },
        { model: User, as: "User", attributes: { exclude: ["password"] } },
      ],
    });

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error("Get teacher error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create teacher
// @route   POST /api/teachers
// @access  Private
const createTeacher = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      gender,
      date_of_birth,
      phone,
      email,
      address,
      qualification,
      specialization,
      joining_date,
      department,
      salary,
      create_user,
    } = req.body;

    // Generate teacher ID
    const year = new Date().getFullYear();
    const count = await Teacher.count();
    const teacherId = `TCH-${year}-${String(count + 1).padStart(3, "0")}`;

    let userId = null;

    // Create user account if requested
    if (create_user && email) {
      const username = email.split("@")[0];
      const user = await User.create({
        username,
        email,
        password: "teacher123", // Default password
        role: "teacher",
        full_name: `${first_name} ${last_name}`,
        phone,
      });
      userId = user.id;
    }

    const teacher = await Teacher.create({
      teacher_id: teacherId,
      user_id: userId,
      first_name,
      last_name,
      gender,
      date_of_birth,
      phone,
      email,
      address,
      qualification,
      specialization,
      joining_date,
      department,
      salary,
      photo: req.file ? req.file.filename : null,
    });

    res.status(201).json({ success: true, data: teacher });
  } catch (error) {
    console.error("Create teacher error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update teacher
// @route   PUT /api/teachers/:id
// @access  Private
const updateTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    const updateData = { ...req.body };
    // Remove photo if not a string (frontend may send empty object)
    if (updateData.photo != null && typeof updateData.photo !== "string") {
      delete updateData.photo;
    }
    if (req.body.remove_photo === "true" && !req.file && teacher.photo) {
      const oldPhotoPath = path.join(__dirname, "../uploads", teacher.photo);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      updateData.photo = null;
    }
    if (req.file) {
      // Delete old photo if exists
      if (teacher.photo) {
        const oldPhotoPath = path.join(__dirname, "../uploads", teacher.photo);
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = req.file.filename;
    }

    await teacher.update(updateData);

    res.json({ success: true, data: teacher });
  } catch (error) {
    console.error("Update teacher error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete teacher
// @route   DELETE /api/teachers/:id
// @access  Private
const deleteTeacher = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Delete associated user if exists
    if (teacher.user_id) {
      await User.destroy({ where: { id: teacher.user_id } });
    }

    // Delete photo file if exists
    if (teacher.photo) {
      const photoPath = path.join(__dirname, "../uploads", teacher.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await teacher.destroy();

    res.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Delete teacher error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete teacher photo
// @route   DELETE /api/teachers/:id/photo
// @access  Private
const deleteTeacherPhoto = async (req, res) => {
  try {
    const teacher = await Teacher.findByPk(req.params.id);

    if (!teacher) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    if (teacher.photo) {
      const photoPath = path.join(__dirname, "../uploads", teacher.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

    await teacher.update({ photo: null });

    res.json({
      success: true,
      message: "Photo deleted successfully",
      data: teacher,
    });
  } catch (error) {
    console.error("Delete teacher photo error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  deleteTeacherPhoto,
};
