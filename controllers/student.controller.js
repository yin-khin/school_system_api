const { Teacher, User, Class, Subject } = require("../models");
const { toDataUri } = require("../utils/photoStorage");
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
      photo: req.file ? await toDataUri(req.file) : null,
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
      updateData.photo = await toDataUri(req.file);
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


// const { toDataUri } = require("../utils/photoStorage");
// const {
//   Student,
//   User,
//   Class,
//   Section,
//   Parent,
//   AcademicYear,
// } = require("../models");
// const { Op } = require("sequelize");
// const path = require("path");
// const fs = require("fs");

// // @desc    Get all students
// // @route   GET /api/students
// // @access  Private
// const getStudents = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = parseInt(req.query.limit) || 10;
//     const offset = (page - 1) * limit;
//     const search = req.query.search || "";
//     const classId = req.query.class_id;
//     const status = req.query.status;

//     const where = {};
//     if (search) {
//       where[Op.or] = [
//         { first_name: { [Op.iLike]: `%${search}%` } },
//         { last_name: { [Op.iLike]: `%${search}%` } },
//         { student_id: { [Op.iLike]: `%${search}%` } },
//         { email: { [Op.iLike]: `%${search}%` } },
//       ];
//     }
//     if (classId) where.class_id = classId;
//     if (status) where.status = status;

//     const { count, rows } = await Student.findAndCountAll({
//       where,
//       include: [
//         { model: Class, as: "Class", attributes: ["id", "name", "code"] },
//         { model: Section, as: "Section", attributes: ["id", "name"] },
//         {
//           model: Parent,
//           as: "Parent",
//           attributes: ["id", "first_name", "last_name", "phone"],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//       limit,
//       offset,
//     });

//     res.json({
//       success: true,
//       data: rows,
//       pagination: {
//         total: count,
//         page,
//         limit,
//         totalPages: Math.ceil(count / limit),
//       },
//     });
//   } catch (error) {
//     console.error("Get students error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Get single student
// // @route   GET /api/students/:id
// // @access  Private
// const getStudent = async (req, res) => {
//   try {
//     const student = await Student.findByPk(req.params.id, {
//       include: [
//         { model: Class, as: "Class" },
//         { model: Section, as: "Section" },
//         { model: Parent, as: "Parent" },
//         { model: User, as: "User", attributes: { exclude: ["password"] } },
//       ],
//     });

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     res.json({ success: true, data: student });
//   } catch (error) {
//     console.error("Get student error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Create student
// // @route   POST /api/students
// // @access  Private
// const createStudent = async (req, res) => {
//   try {
//     const {
//       first_name,
//       last_name,
//       gender,
//       date_of_birth,
//       phone,
//       email,
//       address,
//       admission_date,
//       academic_year_id,
//       class_id,
//       section_id,
//       roll_number,
//       parent_id,
//       emergency_contact,
//       emergency_phone,
//       blood_group,
//       create_user,
//     } = req.body;

//     // Generate student ID
//     const year = new Date().getFullYear();
//     const count = await Student.count();
//     const studentId = `STU-${year}-${String(count + 1).padStart(3, "0")}`;

//     let userId = null;

//     // Create user account if requested
//     if (create_user && email) {
//       const username = email.split("@")[0];
//       const user = await User.create({
//         username,
//         email,
//         password: "student123", // Default password
//         role: "student",
//         full_name: `${first_name} ${last_name}`,
//         phone,
//       });
//       userId = user.id;
//     }

//     const student = await Student.create({
//       student_id: studentId,
//       user_id: userId,
//       first_name,
//       last_name,
//       gender,
//       date_of_birth,
//       phone,
//       email,
//       address,
//       photo: req.file ? await toDataUri(req.file) : null,
//       admission_date,
//       academic_year_id,
//       class_id,
//       section_id,
//       roll_number,
//       parent_id,
//       emergency_contact,
//       emergency_phone,
//       blood_group,
//     });

//     res.status(201).json({ success: true, data: student });
//   } catch (error) {
//     console.error("Create student error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Update student
// // @route   PUT /api/students/:id
// // @access  Private
// const updateStudent = async (req, res) => {
//   try {
//     const student = await Student.findByPk(req.params.id);

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     const updateData = { ...req.body };
//     // Remove photo if not a string (frontend may send empty object)
//     if (updateData.photo != null && typeof updateData.photo !== "string") {
//       delete updateData.photo;
//     }
//     if (req.body.remove_photo === "true" && !req.file && student.photo) {
//       const oldPhotoPath = path.join(__dirname, "../uploads", student.photo);
//       if (fs.existsSync(oldPhotoPath)) {
//         fs.unlinkSync(oldPhotoPath);
//       }
//       updateData.photo = null;
//     }
//     if (req.file) {
//       if (student.photo) {
//         const oldPhotoPath = path.join(__dirname, "../uploads", student.photo);
//         if (fs.existsSync(oldPhotoPath)) {
//           fs.unlinkSync(oldPhotoPath);
//         }
//       }
//       updateData.photo = await toDataUri(req.file);
//     }

//     await student.update(updateData);

//     res.json({ success: true, data: student });
//   } catch (error) {
//     console.error("Update student error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Delete student
// // @route   DELETE /api/students/:id
// // @access  Private
// const deleteStudent = async (req, res) => {
//   try {
//     const student = await Student.findByPk(req.params.id);

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     // Delete associated user if exists
//     if (student.user_id) {
//       await User.destroy({ where: { id: student.user_id } });
//     }

//     // Delete photo file if exists
//     if (student.photo) {
//       const photoPath = path.join(__dirname, "../uploads", student.photo);
//       if (fs.existsSync(photoPath)) {
//         fs.unlinkSync(photoPath);
//       }
//     }

//     await student.destroy();

//     res.json({ success: true, message: "Student deleted successfully" });
//   } catch (error) {
//     console.error("Delete student error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Get students by class
// // @route   GET /api/students/class/:classId
// // @access  Private
// const getStudentsByClass = async (req, res) => {
//   try {
//     const students = await Student.findAll({
//       where: { class_id: req.params.classId, status: "active" },
//       include: [{ model: Section, as: "Section", attributes: ["id", "name"] }],
//       order: [["roll_number", "ASC"]],
//     });

//     res.json({ success: true, data: students });
//   } catch (error) {
//     console.error("Get students by class error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// // @desc    Delete student photo
// // @route   DELETE /api/students/:id/photo
// // @access  Private
// const deleteStudentPhoto = async (req, res) => {
//   try {
//     const student = await Student.findByPk(req.params.id);

//     if (!student) {
//       return res.status(404).json({ message: "Student not found" });
//     }

//     if (student.photo) {
//       const photoPath = path.join(__dirname, "../uploads", student.photo);
//       if (fs.existsSync(photoPath)) {
//         fs.unlinkSync(photoPath);
//       }
//     }

//     await student.update({ photo: null });

//     res.json({
//       success: true,
//       message: "Photo deleted successfully",
//       data: student,
//     });
//   } catch (error) {
//     console.error("Delete student photo error:", error);
//     res.status(500).json({ message: "Server error", error: error.message });
//   }
// };

// module.exports = {
//   getStudents,
//   getStudent,
//   createStudent,
//   updateStudent,
//   deleteStudent,
//   deleteStudentPhoto,
//   getStudentsByClass,
// };
