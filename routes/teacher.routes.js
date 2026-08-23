const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  getTeachers,
  getTeacher,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  deleteTeacherPhoto,
} = require("../controllers/teacher.controller");

router.get("/", getTeachers);
router.get("/:id", getTeacher);
router.use(protect);
router.post("/", upload.single("photo"), createTeacher);
router.put("/:id", upload.single("photo"), updateTeacher);
router.delete("/:id/photo", deleteTeacherPhoto);
router.delete("/:id", deleteTeacher);

module.exports = router;
