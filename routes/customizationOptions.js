const express = require('express');
const router = express.Router();
const CustomizationOptions = require('../models/CustomizationOptions');
const { authenticateToken } = require('../middleware/auth');

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

// Create new customization options
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      productType,
      colors,
      sizes,
      fonts,
      addOns,
      backgrounds,
      dimmerOptions,
      shapeOptions,
      usageOptions
    } = req.body;

    // Check if options already exist for this product type
    const existingOptions = await CustomizationOptions.findOne({ productType });
    if (existingOptions) {
      return res.status(400).json({ 
        message: `Customization options for ${productType} already exist. Use PUT to update.` 
      });
    }

    const customizationOptions = new CustomizationOptions({
      productType,
      colors,
      sizes,
      fonts,
      addOns,
      backgrounds,
      dimmerOptions,
      shapeOptions,
      usageOptions
    });

    const savedOptions = await customizationOptions.save();
    res.status(201).json(savedOptions);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update customization options
router.put('/:productType', authenticateToken, async (req, res) => {
  try {
    const { productType } = req.params;
    const updateData = req.body;

    const options = await CustomizationOptions.findOneAndUpdate(
      { productType },
      updateData,
      { new: true, runValidators: true }
    );

    if (!options) {
      return res.status(404).json({ message: 'Customization options not found' });
    }

    res.json(options);
  } catch (error) {
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