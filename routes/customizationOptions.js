const express = require('express');
const router = express.Router();
const CustomizationOptions = require('../models/CustomizationOptions');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
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
  { name: 'backgroundFiles[4]', maxCount: 1 },
  { name: 'shapeOptionFiles[0]', maxCount: 1 },
  { name: 'shapeOptionFiles[1]', maxCount: 1 },
  { name: 'shapeOptionFiles[2]', maxCount: 1 },
  { name: 'shapeOptionFiles[3]', maxCount: 1 },
  { name: 'shapeOptionFiles[4]', maxCount: 1 }
]);



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

      // Process shapeOption files
      Object.keys(files).forEach(key => {
        const match = key.match(/^shapeOptionFiles\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (options.shapeOptions && options.shapeOptions[index]) {
            options.shapeOptions[index].image = files[key][0].path;
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

    const existingOptions = await CustomizationOptions.findOne({ productType });

    if (files) {
      // Process add-on files
      if (files.addOnFiles) {
        options.addOns = options.addOns.map((addon) => {
          if (addon.file) {
            const file = files.addOnFiles.find(f => f.originalname === addon.file.name);
            return { ...addon, image: file.path };
          }
          return addon;
        });
      }

      // Process background files
      if (files.backgroundFiles) {
        options.backgrounds = options.backgrounds.map((background) => {
          if (background.file) {
            const file = files.backgroundFiles.find(f => f.originalname === background.file.name);
            return { ...background, image: file.path };
          }
          return background;
        });
      }

      // Process shapeOption files
      if (files.shapeOptionFiles && options.shapeOptions) {
        options.shapeOptions = options.shapeOptions.map((shape) => {
          if (shape.file) {
            const file = files.shapeOptionFiles.find(f => f.originalname === shape.file.name);
            return { ...shape, image: file.path };
          }
          return shape;
        });
      }
    }

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