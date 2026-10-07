const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const safeBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter for acceptable file formats (PDF, DOCX, ZIP, PNG, JPG)
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.doc', '.docx', '.zip', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Unsupported file type: ${ext}. Allowed formats: PDF, DOC, DOCX, ZIP, PNG, JPG`
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter,
});

// Cloudinary upload helper with local fallback
let cloudinary;
if (
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
) {
  cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const processUploadedFile = async (reqFile) => {
  if (!reqFile) return null;

  // If Cloudinary is configured, upload to Cloudinary
  if (cloudinary) {
    try {
      const result = await cloudinary.uploader.upload(reqFile.path, {
        resource_type: 'auto',
        folder: 'online-lms/submissions',
      });
      // Optionally clean up local temp file
      try {
        fs.unlinkSync(reqFile.path);
      } catch (e) {
        // ignore
      }
      return {
        url: result.secure_url,
        fileName: reqFile.originalname,
      };
    } catch (uploadErr) {
      console.warn('[Cloudinary] Upload failed, falling back to local file:', uploadErr.message);
    }
  }

  // Fallback to local server static URL
  return {
    url: `/uploads/${reqFile.filename}`,
    fileName: reqFile.originalname,
  };
};

module.exports = {
  upload,
  processUploadedFile,
};
