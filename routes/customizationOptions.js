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
    
    // Handle file cleanup for removed items
    if (existingOptions) {
      // Clean up removed add-on files
      for (const addon of existingOptions.addOns) {
        if (addon.image && !options.addOns.find(a => a.id === addon.id)) {
          try {
            const publicId = addon.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Error deleting old add-on file:', err);
          }
        }
      }

      // Clean up removed background files
      for (const bg of existingOptions.backgrounds) {
        if (bg.image && !options.backgrounds.find(b => b.id === bg.id)) {
          try {
            const publicId = bg.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error('Error deleting old background file:', err);
          }
        }
      }
    }

    // Process new files
    if (files) {
      // Process add-on files
      const addOnFileKeys = Object.keys(files).filter(key => key.startsWith('addOnFiles'));
      for (const key of addOnFileKeys) {
        const match = key.match(/^addOnFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.addOns[index]) {
            // If there's an existing image, delete it from Cloudinary
            if (options.addOns[index].image) {
              try {
                const publicId = options.addOns[index].image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              } catch (err) {
                console.error('Error deleting old add-on file:', err);
              }
            }
            options.addOns[index].image = files[key][0].path;
          }
        }
      }

      // Process background files
      const bgFileKeys = Object.keys(files).filter(key => key.startsWith('backgroundFiles'));
      for (const key of bgFileKeys) {
        const match = key.match(/^backgroundFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.backgrounds[index]) {
            // If there's an existing image, delete it from Cloudinary
            if (options.backgrounds[index].image) {
              try {
                const publicId = options.backgrounds[index].image.split('/').pop().split('.')[0];
                await cloudinary.uploader.destroy(publicId);
              } catch (err) {
                console.error('Error deleting old background file:', err);
              }
            }
            options.backgrounds[index].image = files[key][0].path;
          }
        }
      }
    }

    // Ensure IDs are present for all items that require them
    options.addOns = options.addOns.map(addon => ({
      ...addon,
      id: addon.id || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    options.backgrounds = options.backgrounds.map(bg => ({
      ...bg,
      id: bg.id || `bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    options.shapeOptions = options.shapeOptions.map(shape => ({
      ...shape,
      id: shape.id || `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    options.usageOptions = options.usageOptions.map(usage => ({
      ...usage,
      id: usage.id || `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));

    // Update with new options
    const updatedOptions = await CustomizationOptions.findOneAndUpdate(
      { productType },
      {
        $set: {
          ...options,
          updatedAt: new Date()
        }
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

    // Log the update for debugging
    console.log('Updated options:', {
      productType,
      colorsCount: updatedOptions.colors.length,
      sizesCount: updatedOptions.sizes.length,
      fontsCount: updatedOptions.fonts.length,
      addOnsCount: updatedOptions.addOns.length,
      backgroundsCount: updatedOptions.backgrounds.length
    });

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