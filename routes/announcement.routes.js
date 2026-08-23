const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const uploadImage = require("../middleware/uploadImage");
const {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  deleteAnnouncementPhoto,
} = require("../controllers/announcement.controller");

router.get("/", getAnnouncements);
router.get("/:id", getAnnouncement);
router.use(protect);
router.post("/", uploadImage.single("photo"), createAnnouncement);
router.put("/:id", uploadImage.single("photo"), updateAnnouncement);
router.delete("/:id/photo", deleteAnnouncementPhoto);
router.delete("/:id", deleteAnnouncement);

module.exports = router;
