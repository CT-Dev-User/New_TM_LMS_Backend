import multer from 'multer';

// Memory storage configuration
const storage = multer.memoryStorage();

// File filter for images and videos
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'video/mp4'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (.jpg, .jpeg, .png) and videos (.mp4) allowed'), false);
  }
};

// Export multer middleware
export const uploadFiles = multer({ storage, fileFilter }).single('file');