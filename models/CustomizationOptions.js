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
      required: true,
      validate: {
        validator: function(value) {
          // For Floro: allow null or 'dimmer'
          if (this.productType === 'floro') {
            return value === null || value === 'dimmer';
          }
          // For Neon: allow boolean values
          if (this.productType === 'neon') {
            return typeof value === 'boolean';
          }
          return false;
        },
        message: props => {
          if (props.doc.productType === 'floro') {
            return `Dimmer ID must be null or 'dimmer' for Floro products. Got: ${props.value}`;
          }
          return `Dimmer ID must be a boolean for Neon products. Got: ${props.value}`;
        }
      }
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
  timestamps: true,
  // Add middleware to ensure at least one dimmer option exists
  validateBeforeSave: true
});

// Add middleware to ensure at least one dimmer option exists
customizationOptionsSchema.pre('save', function(next) {
  if (!this.dimmerOptions || this.dimmerOptions.length === 0) {
    if (this.productType === 'floro') {
      this.dimmerOptions = [{
        id: null,
        name: 'No Dimmer',
        icon: '❌',
        price: 0
      }];
    } else {
      this.dimmerOptions = [{
        id: false,
        name: 'No Dimmer',
        icon: '❌',
        price: 0
      }];
    }
  }
  next();
});

// Add middleware to validate dimmer options before update
customizationOptionsSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.$set && (!update.$set.dimmerOptions || update.$set.dimmerOptions.length === 0)) {
    const productType = update.$set.productType;
    if (productType === 'floro') {
      update.$set.dimmerOptions = [{
        id: null,
        name: 'No Dimmer',
        icon: '❌',
        price: 0
      }];
    } else {
      update.$set.dimmerOptions = [{
        id: false,
        name: 'No Dimmer',
        icon: '❌',
        price: 0
      }];
    }
  }
  next();
});

module.exports = mongoose.model('CustomizationOptions', customizationOptionsSchema); 