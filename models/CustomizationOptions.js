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
      default: function() {
        return `addon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
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
      default: function() {
        return `bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    },
    name: String,
    image: String
  }],
  dimmerOptions: [{
    id: {
      type: mongoose.Schema.Types.Mixed,
      default: function() {
        return this.parent().parent().productType === 'floro' ? null : false;
      }
    },
    name: String,
    icon: String,
    price: Number
  }],
  shapeOptions: [{
    id: {
      type: String,
      default: function() {
        return `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
    },
    name: String,
    icon: String,
    price: Number
  }],
  usageOptions: [{
    id: {
      type: String,
      default: function() {
        return `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      }
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

// Add middleware to ensure at least one dimmer option exists
customizationOptionsSchema.pre('save', function(next) {
  if (!this.dimmerOptions || this.dimmerOptions.length === 0) {
    this.dimmerOptions = [{
      id: this.productType === 'floro' ? null : false,
      name: 'No Dimmer',
      icon: '❌',
      price: 0
    }];
  }
  next();
});

// Add middleware to handle updates
customizationOptionsSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  const options = update.$set || update;

  // Ensure IDs are generated for new items
  if (options.addOns) {
    options.addOns = options.addOns.map(addon => ({
      ...addon,
      id: addon.id || `addon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  if (options.backgrounds) {
    options.backgrounds = options.backgrounds.map(bg => ({
      ...bg,
      id: bg.id || `bg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  if (options.shapeOptions) {
    options.shapeOptions = options.shapeOptions.map(shape => ({
      ...shape,
      id: shape.id || `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  if (options.usageOptions) {
    options.usageOptions = options.usageOptions.map(usage => ({
      ...usage,
      id: usage.id || `usage-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
  }

  // Handle dimmer options
  if (options.dimmerOptions) {
    const productType = options.productType || this._conditions.productType;
    if (!options.dimmerOptions.length) {
      options.dimmerOptions = [{
        id: productType === 'floro' ? null : false,
        name: 'No Dimmer',
        icon: '❌',
        price: 0
      }];
    } else {
      options.dimmerOptions = options.dimmerOptions.map(opt => ({
        ...opt,
        id: productType === 'floro' ? (opt.id === null ? null : 'dimmer') : (typeof opt.id === 'boolean' ? opt.id : false)
      }));
    }
  }

  next();
});

module.exports = mongoose.model('CustomizationOptions', customizationOptionsSchema); 