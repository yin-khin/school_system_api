const { Announcement, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

// Convert an uploaded file into a base64 data URI and remove the temp file.
// Render's free tier has an EPHEMERAL filesystem that wipes the local "uploads"
// disk on every restart/redeploy, which is why photos used to disappear.
// Storing the bytes in Postgres keeps announcement photos persistent.
const readImageDataUri = (file) => {
  if (!file) return null;
  const filePath = path.join(__dirname, "../uploads", file.filename);
  const mime = file.mimetype || "image/jpeg";
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (error) {
    console.error("Could not read uploaded announcement image:", error.message);
    return null;
  }
  try {
    fs.unlinkSync(filePath); // no longer needed on disk
  } catch (error) {
    // ignore cleanup failure
  }
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

// Safely attempt to delete an old photo file from disk (if it exists).
const removeImageFile = (photo) => {
  if (!photo || photo.startsWith("data:")) return; // base64 lives in DB only
  const filePath = path.join(__dirname, "../uploads", photo);
  try {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (error) {
    // ignore
  }
};

// @desc    Get all announcements
// @route   GET /api/announcements
// @access  Private
const getAnnouncements = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const { search, type, status } = req.query;

    const where = {};
    if (search) {
      where.title = { [Op.iLike]: `%${search}%` };
    }
    if (type) where.type = type;
    if (status) where.status = status;

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      include: [
        { model: User, as: "User", attributes: ["id", "full_name", "role"] },
      ],
      order: [["published_at", "DESC"]],
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
    console.error("Get announcements error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Private
const getAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id, {
      include: [
        { model: User, as: "User", attributes: ["id", "full_name", "role"] },
      ],
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Create announcement
// @route   POST /api/announcements
// @access  Private
const createAnnouncement = async (req, res) => {
  try {
    const { title, content, type, audience, status } = req.body;

    const announcement = await Announcement.create({
      title,
      content,
      type: type || "general",
      audience: audience || "all",
      published_by: req.user.id,
      status: status || "published",
      photo: req.file ? readImageDataUri(req.file) : null,
    });

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    console.error("Create announcement error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/:id
// @access  Private
const updateAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    const updateData = { ...req.body };
    // Remove photo if not a string (frontend may send empty object)
    if (updateData.photo != null && typeof updateData.photo !== "string") {
      delete updateData.photo;
    }
    if (req.body.remove_photo === "true" && !req.file && announcement.photo) {
      removeImageFile(announcement.photo);
      updateData.photo = null;
    }
    if (req.file) {
      // Delete old photo if exists
      removeImageFile(announcement.photo);
      updateData.photo = readImageDataUri(req.file);
    }
    // If no new file and no remove flag, keep the existing stored photo
    // (announcement.photo is preserved because updateData doesn't override it).

    await announcement.update(updateData);

    res.json({ success: true, data: announcement });
  } catch (error) {
    console.error("Update announcement error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/:id
// @access  Private
const deleteAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    // Delete photo file if exists
    removeImageFile(announcement.photo);

    await announcement.destroy();

    res.json({ success: true, message: "Announcement deleted successfully" });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// @desc    Delete announcement photo
// @route   DELETE /api/announcements/:id/photo
// @access  Private
const deleteAnnouncementPhoto = async (req, res) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    if (announcement.photo) {
      removeImageFile(announcement.photo);
    }

    await announcement.update({ photo: null });

    res.json({
      success: true,
      message: "Photo deleted successfully",
      data: announcement,
    });
  } catch (error) {
    console.error("Delete announcement photo error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getAnnouncements,
  getAnnouncement,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  deleteAnnouncementPhoto,
};
