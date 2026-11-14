const fs = require("fs");
const path = require("path");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const MAX_RAW_BYTES = 1.5 * 1024 * 1024; // used only if resizing is unavailable

let sharp = null;
try {
  sharp = require("sharp");
} catch (error) {
  console.warn("sharp is not available, photos will be stored without resizing");
}

const isInlineImage = (value) =>
  typeof value === "string" && (value.startsWith("data:") || /^https?:\/\//i.test(value));

// Render's free tier has an EPHEMERAL disk: files in /uploads are deleted on
// every restart or redeploy, which left broken images everywhere. Instead of
// keeping the file, turn the upload into a (resized) base64 data URI that is
// stored in Postgres, and delete the temporary file.
const toDataUri = async (file) => {
  if (!file) return null;
  const filePath = path.join(UPLOAD_DIR, file.filename);

  let buffer;
  try {
    buffer = fs.readFileSync(filePath);
  } catch (error) {
    console.error("Could not read uploaded photo:", error.message);
    return null;
  }

  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    // ignore cleanup failure
  }

  let mime = file.mimetype || "image/jpeg";

  if (sharp && mime !== "image/gif") {
    try {
      // Profile photos do not need to be large. Keeping them small keeps the
      // student/teacher lists fast, since the photo is part of every row.
      buffer = await sharp(buffer)
        .rotate() // respect the phone's EXIF orientation
        .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 82 })
        .toBuffer();
      mime = "image/jpeg";
    } catch (error) {
      console.error("Could not resize photo, storing the original:", error.message);
    }
  }

  if (buffer.length > MAX_RAW_BYTES && mime !== "image/jpeg") {
    const err = new Error("Photo is too large. Please choose a smaller image.");
    err.status = 400;
    throw err;
  }

  return `data:${mime};base64,${buffer.toString("base64")}`;
};

// Sequelize column definition for a photo. TEXT (not STRING) so it can hold a
// base64 data URI. The getter hides old records whose file was lost when the
// server's disk was wiped, so the app shows the initials instead of a broken
// image.
const photoColumn = (DataTypes) => ({
  type: DataTypes.TEXT,
  get() {
    const value = this.getDataValue("photo");
    if (!value) return null;
    if (isInlineImage(value)) return value;
    return fs.existsSync(path.join(UPLOAD_DIR, value)) ? value : null;
  },
});

module.exports = { toDataUri, photoColumn };
