import 'dotenv/config';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aiinsight/profile-photos',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
        transformation: [{ width: 500, height: 500, crop: 'limit' }]
    }
});

// Create multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Configure Cloudinary storage for resources (PDFs)
const resourceStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'aiinsight/resources',
        allowed_formats: ['pdf'],
        resource_type: 'raw' // Important for non-image files like PDFs
    }
});

// Create multer upload middleware for resources
const uploadResource = multer({
    storage: resourceStorage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

export { cloudinary, upload, uploadResource };
