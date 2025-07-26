const express = require('express');
const router = express.Router();
const CustomizationOptions = require('../models/CustomizationOptions');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Configure storage for customization options
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'customization-options',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
    transformation: [{ width: 800, height: 800, crop: 'limit' }],
    resource_type: 'auto'
  }
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Configure multiple file upload fields
const uploadFields = upload.fields([
  { name: /^addOnFiles\[\d+\]/, maxCount: 1 }, // Dynamic field names for add-ons
  { name: /^backgroundFiles\[\d+\]/, maxCount: 1 } // Dynamic field names for backgrounds
]);

// Middleware to handle multer upload
const handleUpload = (req, res, next) => {
  uploadFields(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: 'File upload error', details: err.message });
    } else if (err) {
      return res.status(500).json({ error: 'File upload error', details: err.message });
    }
    next();
  });
};

// Get all customization options
router.get('/', async (req, res) => {
  try {
    const options = await CustomizationOptions.find({ isActive: true });
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get customization options by product type
router.get('/:productType', async (req, res) => {
  try {
    const { productType } = req.params;
    const options = await CustomizationOptions.findOne({ 
      productType, 
      isActive: true 
    });
    
    if (!options) {
      return res.status(404).json({ message: 'Customization options not found' });
    }
    
    res.json(options);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new customization options with file upload
router.post('/', authenticateToken, handleUpload, async (req, res) => {
  try {
    let options = JSON.parse(req.body.options);
    const files = req.files;

    // Process add-on files
    if (files) {
      Object.keys(files).forEach(key => {
        const match = key.match(/^addOnFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.addOns[index]) {
            options.addOns[index].image = files[key][0].path;
          }
        }
      });

      // Process background files
      Object.keys(files).forEach(key => {
        const match = key.match(/^backgroundFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.backgrounds[index]) {
            options.backgrounds[index].image = files[key][0].path;
          }
        }
      });
    }

    // Check if options already exist for this product type
    const existingOptions = await CustomizationOptions.findOne({ productType: options.productType });
    if (existingOptions) {
      return res.status(400).json({ 
        message: `Customization options for ${options.productType} already exist. Use PUT to update.` 
      });
    }

    const customizationOptions = new CustomizationOptions(options);
    const savedOptions = await customizationOptions.save();
    res.status(201).json(savedOptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customization options with file upload
router.put('/:productType', authenticateToken, handleUpload, async (req, res) => {
  try {
    const { productType } = req.params;
    let options = JSON.parse(req.body.options);
    const files = req.files;

    // Get existing options to handle file cleanup
    const existingOptions = await CustomizationOptions.findOne({ productType });
    if (existingOptions) {
      // Clean up removed add-on files
      existingOptions.addOns.forEach(async (addon) => {
        if (addon.image && !options.addOns.find(a => a.id === addon.id)) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = addon.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Error deleting old add-on file:', err);
          }
        }
      });

      // Clean up removed background files
      existingOptions.backgrounds.forEach(async (bg) => {
        if (bg.image && !options.backgrounds.find(b => b.id === bg.id)) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = bg.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Error deleting old background file:', err);
          }
        }
      });
    }

    // Process add-on files
    if (files) {
      Object.keys(files).forEach(key => {
        const match = key.match(/^addOnFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.addOns[index]) {
            options.addOns[index].image = files[key][0].path;
          }
        }
      });

      // Process background files
      Object.keys(files).forEach(key => {
        const match = key.match(/^backgroundFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.backgrounds[index]) {
            options.backgrounds[index].image = files[key][0].path;
          }
        }
      });
    }

    // Update with new options
    const updatedOptions = await CustomizationOptions.findOneAndUpdate(
      { productType },
      {
        ...options,
        updatedAt: new Date()
      },
      { 
        new: true, 
        runValidators: true,
        upsert: true // Create if doesn't exist
      }
    );

    if (!updatedOptions) {
      return res.status(404).json({ message: 'Failed to update customization options' });
    }

    res.json(updatedOptions);
  } catch (error) {
    console.error('Error updating customization options:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete customization options (soft delete)
router.delete('/:productType', authenticateToken, async (req, res) => {
  try {
    const { productType } = req.params;
    
    const options = await CustomizationOptions.findOneAndUpdate(
      { productType },
      { isActive: false },
      { new: true }
    );

    if (!options) {
      return res.status(404).json({ message: 'Customization options not found' });
    }

    res.json({ message: 'Customization options deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 