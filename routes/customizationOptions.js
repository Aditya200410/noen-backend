const express = require('express');
const router = express.Router();
const CustomizationOptions = require('../models/CustomizationOptions');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'customization-options',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'svg'],
        transformation: [{ width: 800, height: 800, crop: 'limit' }],
        resource_type: 'auto'
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const uploadFields = upload.fields([
    { name: 'addOnImages', maxCount: 5 },
    { name: 'backgroundImages', maxCount: 5 },
    { name: 'shapeOptionImages', maxCount: 5 }
]);

// Middleware to handle multer upload
const handleUpload = (req, res, next) => {
  uploadFields(req, res, function(err) {
    if (err instanceof multer.MulterError) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: 'File upload error', details: err.message });
    } else if (err) {
      console.error('Upload error:', err);
      return res.status(500).json({ error: 'File upload error', details: err.message });
    }
    
    // Log successful file uploads
    if (req.files) {
      console.log('Files received:', {
        addOnImages: req.files.addOnImages?.length || 0,
        backgroundImages: req.files.backgroundImages?.length || 0,
        shapeOptionImages: req.files.shapeOptionImages?.length || 0
      });
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
    console.log('=== Creating New Customization Options ===');
    let options = JSON.parse(req.body.options);
    const files = req.files;

    if (files) {
      // Process addOn images
      if (files.addOnImages) {
        files.addOnImages.forEach((file, index) => {
          if (options.addOns[index]) {
            options.addOns[index].image = file.path;
          }
        });
      }

      // Process background images
      if (files.backgroundImages) {
        files.backgroundImages.forEach((file, index) => {
          if (options.backgrounds[index]) {
            options.backgrounds[index].image = file.path;
          }
        });
      }

      // Process shapeOption images
      if (files.shapeOptionImages) {
        files.shapeOptionImages.forEach((file, index) => {
          if (options.shapeOptions[index]) {
            options.shapeOptions[index].image = file.path;
          }
        });
      }
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
    console.error('Error creating customization options:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update customization options with file upload
router.put('/:productType', authenticateToken, handleUpload, async (req, res) => {
    try {
        const { productType } = req.params;
        let options = JSON.parse(req.body.options);
        const files = req.files;

        // Clean up old files
        const existingOptions = await CustomizationOptions.findOne({ productType });
        if (existingOptions) {
            // Delete removed files from Cloudinary
            for (const addon of existingOptions.addOns) {
                if (addon.image && !options.addOns.find(a => a.name === addon.name)) {
                    const publicId = addon.image.split('/').pop().split('.')[0];
                    await cloudinary.uploader.destroy(publicId);
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

            // Clean up removed shapeOption files
            if (existingOptions.shapeOptions) {
                for (const shape of existingOptions.shapeOptions) {
                    if (shape.image && (!options.shapeOptions || !options.shapeOptions.find(s => s.name === shape.name))) {
                        try {
                          const publicId = shape.image.split('/').pop().split('.')[0];
                          await cloudinary.uploader.destroy(publicId);
                          console.log('Deleted old shapeOption file:', publicId);
                        } catch (err) {
                          console.error('Error deleting old shapeOption file:', err);
                        }
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

            // Process shapeOption files
            if (options.shapeOptions) {
                for (let i = 0; i < options.shapeOptions.length; i++) {
                    const fileKey = `shapeOptionFiles[${i}]`;
                    if (files[fileKey] && files[fileKey][0]) {
                        const file = files[fileKey][0];
                        console.log(`Processing shapeOption file ${i}:`, file.path);
                        options.shapeOptions[i].image = file.path;
                    }
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