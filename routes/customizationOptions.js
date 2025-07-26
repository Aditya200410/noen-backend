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
}).fields([
  { name: 'addOnFiles[0]', maxCount: 1 },
  { name: 'addOnFiles[1]', maxCount: 1 },
  { name: 'addOnFiles[2]', maxCount: 1 },
  { name: 'addOnFiles[3]', maxCount: 1 },
  { name: 'addOnFiles[4]', maxCount: 1 },
  { name: 'backgroundFiles[0]', maxCount: 1 },
  { name: 'backgroundFiles[1]', maxCount: 1 },
  { name: 'backgroundFiles[2]', maxCount: 1 },
  { name: 'backgroundFiles[3]', maxCount: 1 },
  { name: 'backgroundFiles[4]', maxCount: 1 }
]);

// Middleware to handle multer upload
const handleUpload = (req, res, next) => {
  upload(req, res, function(err) {
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
router.put('/:productType', authenticateToken, upload, async (req, res) => {
  try {
    const { productType } = req.params;
    let options = JSON.parse(req.body.options);
    const files = req.files;

    console.log('Received files:', files);
    console.log('Received options:', options);

    // Get existing options to handle file cleanup
    const existingOptions = await CustomizationOptions.findOne({ productType });
    
    // Handle file cleanup for removed items
    if (existingOptions) {
      // Clean up removed add-on files
      for (const addon of existingOptions.addOns) {
        if (addon.image && !options.addOns.find(a => a.name === addon.name)) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = addon.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
            console.log('Deleted old add-on file:', publicId);
          } catch (err) {
            console.error('Error deleting old add-on file:', err);
          }
        }
      }

      // Clean up removed background files
      for (const bg of existingOptions.backgrounds) {
        if (bg.image && !options.backgrounds.find(b => b.name === bg.name)) {
          try {
            // Extract public_id from Cloudinary URL
            const publicId = bg.image.split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId);
            console.log('Deleted old background file:', publicId);
          } catch (err) {
            console.error('Error deleting old background file:', err);
          }
        }
      }
    }

    // Process new files
    if (files) {
      console.log('Processing new files...');

      // Process add-on files
      for (let i = 0; i < options.addOns.length; i++) {
        const fileKey = `addOnFiles[${i}]`;
        if (files[fileKey] && files[fileKey][0]) {
          const file = files[fileKey][0];
          console.log(`Processing add-on file ${i}:`, file.path);
          options.addOns[i].image = file.path;

          // For Floro, handle SVG content
          if (productType === 'floro' && file.mimetype === 'image/svg+xml') {
            options.addOns[i].svg = file.path;
          }
        }
      }

      // Process background files
      for (let i = 0; i < options.backgrounds.length; i++) {
        const fileKey = `backgroundFiles[${i}]`;
        if (files[fileKey] && files[fileKey][0]) {
          const file = files[fileKey][0];
          console.log(`Processing background file ${i}:`, file.path);
          options.backgrounds[i].image = file.path;
        }
      }
    }

    // Convert numeric values
    options.sizes = options.sizes.map(size => ({
      ...size,
      width: Number(size.width),
      height: Number(size.height),
      price: Number(size.price)
    }));

    options.addOns = options.addOns.map(addon => ({
      ...addon,
      price: Number(addon.price)
    }));

    options.dimmerOptions = options.dimmerOptions.map(opt => ({
      ...opt,
      price: Number(opt.price)
    }));

    options.shapeOptions = options.shapeOptions.map(opt => ({
      ...opt,
      price: Number(opt.price)
    }));

    options.usageOptions = options.usageOptions.map(opt => ({
      ...opt,
      price: Number(opt.price)
    }));

    console.log('Processed options before update:', options);

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
        upsert: true,
        setDefaultsOnInsert: true
      }
    );

    if (!updatedOptions) {
      return res.status(404).json({ message: 'Failed to update customization options' });
    }

    console.log('Updated options:', {
      productType,
      colorsCount: updatedOptions.colors.length,
      sizesCount: updatedOptions.sizes.length,
      fontsCount: updatedOptions.fonts.length,
      addOnsCount: updatedOptions.addOns.length,
      backgroundsCount: updatedOptions.backgrounds.length,
      dimmerOptionsCount: updatedOptions.dimmerOptions.length,
      dimmerIds: updatedOptions.dimmerOptions.map(opt => opt.id),
      addOnImages: updatedOptions.addOns.map(addon => addon.image),
      backgroundImages: updatedOptions.backgrounds.map(bg => bg.image)
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