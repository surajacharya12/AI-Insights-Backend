import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// -----------------------------
// Configure Cloudinary
// -----------------------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // ensures https URLs
});

// -----------------------------
// Image Upload Storage (e.g., profile photos, thumbnails)
// -----------------------------
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aiinsight/images', // main folder for all images
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1024, height: 1024, crop: 'limit' }, // default resize
    ],
  },
});

// Multer middleware for image uploads
const upload = multer({
  storage: imageStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

// -----------------------------
// Resource Upload Storage (e.g., PDFs, docs)
// -----------------------------
const resourceStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'aiinsight/resources',
    allowed_formats: ['pdf', 'docx', 'txt'],
    resource_type: 'raw', // non-image files
  },
});

// Multer middleware for resources
const uploadResource = multer({
  storage: resourceStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// -----------------------------
// Export Cloudinary + Multer
// -----------------------------
export { cloudinary, upload, uploadResource };
