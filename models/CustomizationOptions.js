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
    id: {
      type: String,
      required: true
    },
    name: String,
    icon: String,
    price: Number,
    image: String,
    svg: String
  }],
  backgrounds: [{
    id: {
      type: String,
      required: true
    },
    name: String,
    image: String
  }],
  dimmerOptions: [{
    id: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    name: String,
    icon: String,
    price: Number
  }],
  shapeOptions: [{
    id: {
      type: String,
      required: true
    },
    name: String,
    icon: String,
    price: Number
  }],
  usageOptions: [{
    id: {
      type: String,
      required: true
    },
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