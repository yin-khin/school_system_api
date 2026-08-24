const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
} = require("../controllers/subject.controller");

router.get("/", getSubjects);
router.get("/:id", getSubject);
router.use(protect);

router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

module.exports = router;
