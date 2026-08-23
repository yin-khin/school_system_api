const { Announcement, User } = require("../models");
const { Op } = require("sequelize");
const path = require("path");
const fs = require("fs");

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
      photo: req.file ? req.file.filename : null,
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
      const oldPhotoPath = path.join(
        __dirname,
        "../uploads",
        announcement.photo,
      );
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
      updateData.photo = null;
    }
    if (req.file) {
      // Delete old photo if exists
      if (announcement.photo) {
        const oldPhotoPath = path.join(
          __dirname,
          "../uploads",
          announcement.photo,
        );
        if (fs.existsSync(oldPhotoPath)) {
          fs.unlinkSync(oldPhotoPath);
        }
      }
      updateData.photo = req.file.filename;
    }

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
    if (announcement.photo) {
      const photoPath = path.join(__dirname, "../uploads", announcement.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
    }

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
      const photoPath = path.join(__dirname, "../uploads", announcement.photo);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
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
