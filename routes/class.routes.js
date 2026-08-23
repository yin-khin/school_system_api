const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  getClasses,
  getClass,
  createClass,
  updateClass,
  deleteClass,
  getClassSections,
  createSection,
  updateSection,
  deleteSection,
} = require("../controllers/class.controller");

router.get("/", getClasses);
router.get("/:id", getClass);
router.use(protect);
router.post("/", createClass);
router.put("/:id", updateClass);
router.delete("/:id", deleteClass);

// Section routes
router.get("/:id/sections", getClassSections);
router.post("/:id/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

module.exports = router;
