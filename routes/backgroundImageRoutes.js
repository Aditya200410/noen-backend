const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const path = require('path');
const fs = require('fs');
const BackgroundImage = require('../models/BackgroundImage');
const cloudinary = require('cloudinary').v2;

// Ensure uploads directory exists
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Error handling middleware for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size is too large. Maximum size is 5MB.' });
        }
        return res.status(400).json({ error: err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
};

// Routes with logging
const routes = router;

routes.get('/', authenticateToken, isAdmin, async (req, res) => {
    try {
        const images = await BackgroundImage.find().sort({ createdAt: -1 });
        res.json(images);
    } catch (error) {
        console.error('Error fetching background images:', error);
        res.status(500).json({ error: 'Failed to fetch background images' });
    }
});

routes.get('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const image = await BackgroundImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Background image not found' });
        }
        res.json(image);
    } catch (error) {
        console.error('Error fetching background image:', error);
        res.status(500).json({ error: 'Failed to fetch background image' });
    }
});

routes.post('/', authenticateToken, isAdmin, upload.single('image'), handleMulterError, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'background-images',
            resource_type: 'auto'
        });

        // Create new background image
        const backgroundImage = new BackgroundImage({
            name: req.body.name || 'Untitled',
            category: req.body.category,
            description: req.body.description,
            imageUrl: result.secure_url,
            cloudinaryId: result.public_id
        });

        await backgroundImage.save();
        
        // Cleanup uploaded file
        if (req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        
        res.status(201).json(backgroundImage);
    } catch (error) {
        console.error('Error creating background image:', error);
        if (req.file?.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        res.status(500).json({ error: 'Failed to create background image' });
    }
});

routes.put('/:id', authenticateToken, isAdmin, upload.single('image'), handleMulterError, async (req, res) => {
    try {
        const image = await BackgroundImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Background image not found' });
        }

        // Update image file if provided
        if (req.file) {
            // Delete old image from Cloudinary if exists
            if (image.cloudinaryId) {
                try {
                    await cloudinary.uploader.destroy(image.cloudinaryId);
                } catch (error) {
                    console.error('Error deleting old image from Cloudinary:', error);
                }
            }

            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'background-images',
                resource_type: 'auto'
            });

            image.imageUrl = result.secure_url;
            image.cloudinaryId = result.public_id;

            // Cleanup uploaded file
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }

        // Update other fields
        if (req.body.name) image.name = req.body.name;
        if (req.body.category) image.category = req.body.category;
        if (req.body.description) image.description = req.body.description;

        await image.save();
        res.json(image);
    } catch (error) {
        console.error('Error updating background image:', error);
        if (req.file?.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        res.status(500).json({ error: 'Failed to update background image' });
    }
});

routes.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const image = await BackgroundImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Background image not found' });
        }

        // Delete image from Cloudinary if exists
        if (image.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(image.cloudinaryId);
            } catch (error) {
                console.error('Error deleting image from Cloudinary:', error);
            }
        }

        await BackgroundImage.deleteOne({ _id: image._id });
        res.json({ message: 'Background image deleted successfully' });
    } catch (error) {
        console.error('Error deleting background image:', error);
        res.status(500).json({ error: 'Failed to delete background image' });
    }
});

module.exports = router;
