const express = require("express");
const { protect, authorize } = require("../middleware/auth");
const uploadImage = require("../middleware/uploadImage");
const {
  getSite,
  createSite,
  updateSite,
  deleteSite,
} = require("../controllers/site.controller");

const router = express.Router();

router.get("/site", getSite);
router.post(
  "/site",
  protect,
  authorize("super_admin", "admin"),
  uploadImage.single("heroImage"),
  createSite,
);
router.put(
  "/site/:id",
  protect,
  authorize("super_admin", "admin"),
  uploadImage.single("heroImage"),
  updateSite,
);
router.delete(
  "/site/:id",
  protect,
  authorize("super_admin", "admin"),
  deleteSite,
);

module.exports = router;
