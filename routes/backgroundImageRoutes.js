const express = require('express');
const router = express.Router();
const multer = require('multer');
const { validateAdminToken } = require('../middleware/auth');
const {
    getAllBackgroundImages,
    getBackgroundImage,
    createBackgroundImage,
    updateBackgroundImage,
    deleteBackgroundImage
} = require('../controllers/backgroundImageController');

// Configure multer for file upload
const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Routes
router.get('/', validateAdminToken, getAllBackgroundImages);
router.get('/:id', validateAdminToken, getBackgroundImage);
router.post('/', validateAdminToken, upload.single('image'), createBackgroundImage);
router.put('/:id', validateAdminToken, upload.single('image'), updateBackgroundImage);
router.delete('/:id', validateAdminToken, deleteBackgroundImage);

module.exports = router;
