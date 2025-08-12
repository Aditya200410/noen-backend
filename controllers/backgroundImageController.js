const BackgroundImage = require('../models/BackgroundImage');
const cloudinary = require('cloudinary').v2;
const fs = require('fs').promises;

const backgroundImageController = {

const backgroundImageController = {

// Get all background images
    getAllBackgroundImages: async (req, res) => {
        try {
            const images = await BackgroundImage.find().sort({ createdAt: -1 });
            res.json(images);
        } catch (error) {
            console.error('Error fetching background images:', error);
            res.status(500).json({ error: 'Failed to fetch background images' });
        }
    },

// Get a single background image by ID
    getBackgroundImage: async (req, res) => {
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
    },

// Create a new background image
    createBackgroundImage: async (req, res) => {
        try {
            if (!isCloudinaryConfigured()) {
                return res.status(500).json({ error: 'Image upload is not configured' });
            }

            if (!req.file) {
                return res.status(400).json({ error: 'No image file provided' });
            }

            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'background-images',
                resource_type: 'auto',
                use_filename: true
            });

            // Create new background image
            const backgroundImage = new BackgroundImage({
                name: req.body.name,
                category: req.body.category,
                description: req.body.description,
                imageUrl: result.secure_url,
                cloudinaryId: result.public_id
            });

            await backgroundImage.save();
            
            // Cleanup uploaded file
            if (req.file && req.file.path) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });
            }
            
            res.status(201).json(backgroundImage);
        } catch (error) {
            console.error('Error creating background image:', error);
            res.status(500).json({ error: 'Failed to create background image' });
        }
    },

// Update a background image
exports.updateBackgroundImage = async (req, res) => {
    try {
        if (!isCloudinaryConfigured() && req.file) {
            return res.status(500).json({ error: 'Image upload is not configured' });
        }

        const image = await BackgroundImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Background image not found' });
        }

        // Update image file if provided
        if (req.file) {
            // Delete old image from Cloudinary
            if (image.cloudinaryId) {
                await cloudinary.uploader.destroy(image.cloudinaryId);
            }

            // Upload new image to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'background-images',
                resource_type: 'auto'
            });

            image.imageUrl = result.secure_url;
            image.cloudinaryId = result.public_id;
        }

        // Update other fields
        image.name = req.body.name || image.name;
        image.category = req.body.category || image.category;
        image.description = req.body.description || image.description;

        await image.save();
        
        // Cleanup uploaded file
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        
        res.json(image);
    } catch (error) {
        console.error('Error updating background image:', error);
        res.status(500).json({ error: 'Failed to update background image' });
    }
};

// Delete a background image
exports.deleteBackgroundImage = async (req, res) => {
    try {
        const image = await BackgroundImage.findById(req.params.id);
        if (!image) {
            return res.status(404).json({ error: 'Background image not found' });
        }

        // Delete image from Cloudinary
        if (image.cloudinaryId) {
            await cloudinary.uploader.destroy(image.cloudinaryId);
        }

        await BackgroundImage.deleteOne({ _id: image._id });
        res.json({ message: 'Background image deleted successfully' });
    } catch (error) {
        console.error('Error deleting background image:', error);
        res.status(500).json({ error: 'Failed to delete background image' });
    }
};
