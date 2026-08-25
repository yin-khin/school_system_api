const { Op } = require("sequelize");
const fs = require("fs");
const path = require("path");
const { SiteSetting } = require("../models");

const defaults = (index = 1) => ({
  key: `hero-${index}`,
  school_name: process.env.SCHOOL_NAME || "Sokha School",
  motto: process.env.SCHOOL_MOTTO || "Knowledge • Discipline • Future",
  intro:
    process.env.SCHOOL_INTRO ||
    "Providing quality education for a brighter future",
  years_of_excellence: process.env.SCHOOL_YEARS || "25+",
  hero_image: process.env.SCHOOL_HERO_IMAGE || null,
});

// Convert an uploaded file into a base64 data URI and remove the temporary file.
// Render's free tier has an EPHEMERAL filesystem that wipes the local "uploads"
// disk on every restart/redeploy, which is why photos used to disappear. Storing
// the image bytes in the persistent Postgres database keeps hero photos visible
// forever until the slide is deleted.
const readImageDataUri = (file) => {
  if (!file) return null;
  const filePath = path.join(__dirname, "../uploads", file.filename);
  const mime = file.mimetype || "image/jpeg";
  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (error) {
    console.error("Could not read uploaded hero image:", error.message);
    return null;
  }
  try {
    fs.unlinkSync(filePath); // no longer needed on disk
  } catch (error) {
    // ignore cleanup failure
  }
  return `data:${mime};base64,${buffer.toString("base64")}`;
};

const toPublicData = (setting) => ({
  id: setting.id,
  schoolName: setting.school_name,
  motto: setting.motto,
  intro: setting.intro,
  yearsOfExcellence: setting.years_of_excellence,
  heroImage: setting.hero_image,
});

const getSite = async (req, res) => {
  try {
    let settings = await SiteSetting.findAll({
      where: { key: { [Op.like]: "hero-%" } },
      order: [["key", "ASC"]],
    });
    if (settings.length === 0)
      settings = [await SiteSetting.create(defaults())];
    res.json({ success: true, data: settings.map(toPublicData) });
  } catch (error) {
    console.error("Get site settings error:", error);
    res.status(500).json({ message: "Could not load site settings" });
  }
};

const updateSite = async (req, res) => {
  try {
    const values = {
      school_name: req.body.schoolName,
      motto: req.body.motto,
      intro: req.body.intro,
      years_of_excellence: req.body.yearsOfExcellence,
    };

    // A new uploaded file becomes a base64 data URI persisted in the DB.
    // Otherwise keep whatever hero image is already stored.
    if (req.file) {
      values.hero_image = readImageDataUri(req.file);
    } else if (req.body.heroImage) {
      values.hero_image = String(req.body.heroImage).trim();
    }

    if (
      !values.school_name ||
      !values.motto ||
      !values.intro ||
      !values.years_of_excellence
    ) {
      return res
        .status(400)
        .json({ message: "School name, motto, intro, and years are required" });
    }

    const setting = await SiteSetting.findByPk(req.params.id);
    if (!setting)
      return res.status(404).json({ message: "Hero slide not found" });
    await setting.update(values);

    res.json({
      success: true,
      data: toPublicData(setting),
      message: "Hero settings saved successfully",
    });
  } catch (error) {
    console.error("Update site settings error:", error);
    res
      .status(500)
      .json({ message: "Could not save site settings", error: error.message });
  }
};

const createSite = async (req, res) => {
  try {
    const values = {
      school_name: req.body.schoolName,
      motto: req.body.motto,
      intro: req.body.intro,
      years_of_excellence: req.body.yearsOfExcellence,
    };

    if (req.file) {
      values.hero_image = readImageDataUri(req.file);
    } else if (req.body.heroImage) {
      values.hero_image = String(req.body.heroImage).trim();
    }

    if (
      !values.school_name ||
      !values.motto ||
      !values.intro ||
      !values.years_of_excellence
    ) {
      return res.status(400).json({ message: "All Hero fields are required" });
    }
    const count = await SiteSetting.count({
      where: { key: { [Op.like]: "hero-%" } },
    });
    if (count >= 4)
      return res
        .status(400)
        .json({ message: "Only 4 Hero slides are allowed" });
    const setting = await SiteSetting.create({
      key: `hero-${count + 1}`,
      ...values,
    });
    res
      .status(201)
      .json({
        success: true,
        data: toPublicData(setting),
        message: "Hero slide added successfully",
      });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not add Hero slide", error: error.message });
  }
};

const deleteSite = async (req, res) => {
  try {
    const setting = await SiteSetting.findByPk(req.params.id);
    if (!setting)
      return res.status(404).json({ message: "Hero slide not found" });
    await setting.destroy();
    res.json({ success: true, message: "Hero slide deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Could not delete Hero slide", error: error.message });
  }
};

module.exports = { getSite, createSite, updateSite, deleteSite };
