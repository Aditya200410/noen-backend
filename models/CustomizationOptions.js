const mongoose = require('mongoose');

const customizationOptionsSchema = new mongoose.Schema({
  productType: {
    type: String,
    enum: ['neon', 'floro'],
    required: true
  },
  colors: [{
    name: String,
    value: String,
    class: String
  }],
  sizes: [{
    value: String,
    name: String,
    width: Number,
    height: Number,
    price: Number
  }],
  fonts: [{
    name: String,
    class: String,
    font: String
  }],
  addOns: [{
    id: String,
    name: String,
    icon: String,
    price: Number,
    image: String,
    svg: String
  }],
  backgrounds: [{
    id: String,
    name: String,
    image: String
  }],
  dimmerOptions: [{
    id: mongoose.Schema.Types.Mixed,
    name: String,
    icon: String,
    price: Number
  }],
  shapeOptions: [{
    id: String,
    name: String,
    icon: String,
    price: Number
  }],
  usageOptions: [{
    id: String,
    name: String,
    icon: String,
    price: Number
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('CustomizationOptions', customizationOptionsSchema); 