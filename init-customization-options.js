require('dotenv').config();
const mongoose = require('mongoose');
const CustomizationOptions = require('./models/CustomizationOptions');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://lightyagami98k:UN1cr0DnJwISvvgs@cluster0.uwkswmj.mongodb.net/neon?retryWrites=true&w=majority&appName=Cluster0";

const defaultFloroOptions = {
  productType: 'floro',
  colors: [
    { name: 'Electric lime', value: '#00ffff', class: 'from-cyan-400' },
    { name: 'Hot pink', value: '#ff00ff', class: 'from-pink-500' },
    { name: 'Neon Green', value: '#39ff14', class: 'from-green-400' },
    { name: 'lime Haze', value: '#b026ff', class: 'from-lime-500' },
    { name: 'Fire Red', value: '#ff0000', class: 'from-red-500' },
    { name: 'Golden Sun', value: '#ffd700', class: 'from-yellow-400' },
    { name: 'Rainbow Mode', value: 'rainbow', class: 'from-white' }
  ],
  sizes: [
    { value: 'regular', name: 'Regular', width: 3, height: 10, price: 299 },
    { value: 'medium', name: 'Medium', width: 4, height: 10, price: 399 },
    { value: 'large', name: 'Large', width: 5, height: 10, price: 499 }
  ],
  fonts: [
    { name: 'Passionate', class: 'font-dancing-script', font: 'Dancing Script' },
    { name: 'Dreamy', class: 'font-great-vibes', font: 'Great Vibes' },
    { name: 'Flowy', class: 'font-parisienne', font: 'Parisienne' },
    { name: 'Original', class: 'font-fredoka', font: 'Fredoka' },
    { name: 'Classic', class: 'font-georgia', font: 'Georgia' },
    { name: 'Boujee', class: 'font-playfair', font: 'Playfair Display' },
    { name: 'Funky', class: 'font-righteous', font: 'Righteous' },
    { name: 'Chic', class: 'font-poppins', font: 'Poppins' },
    { name: 'Delight', class: 'font-comfortaa', font: 'Comfortaa' },
    { name: 'Classy', class: 'font-cormorant', font: 'Cormorant Garamond' },
    { name: 'Romantic', class: 'font-alex-brush', font: 'Alex Brush' },
    { name: 'Robo', class: 'font-orbitron', font: 'Orbitron' },
    { name: 'Charming', class: 'font-merienda', font: 'Merienda' },
    { name: 'Quirky', class: 'font-gloria-hallelujah', font: 'Gloria Hallelujah' },
    { name: 'Stylish', class: 'font-montserrat', font: 'Montserrat' },
    { name: 'Sassy', class: 'font-lobster', font: 'Lobster' },
    { name: 'Glam', class: 'font-aboreto', font: 'Aboreto' },
    { name: 'DOPE', class: 'font-anton', font: 'Anton' },
    { name: 'Chemistry', class: 'font-nunito', font: 'Nunito' },
    { name: 'Acoustic', class: 'font-patrick-hand', font: 'Patrick Hand' },
    { name: 'Sparky', class: 'font-bungee', font: 'Bungee' },
    { name: 'Vibey', class: 'font-rajdhani', font: 'Rajdhani' },
    { name: 'LoFi', class: 'font-share-tech-mono', font: 'Share Tech Mono' },
    { name: 'Bossy', class: 'font-bebas-neue', font: 'Bebas Neue' },
    { name: 'ICONIC', class: 'font-black-han-sans', font: 'Black Han Sans' },
    { name: 'Jolly', class: 'font-chewy', font: 'Chewy' },
    { name: 'MODERN', class: 'font-urbanist', font: 'Urbanist' }
  ],
  addOns: [
    { 
      id: 'flowers', 
      name: 'Flowers', 
      icon: '🌸', 
      price: 500,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="48" height="48" fill="currentColor">
        <path d="M50 0C47 0 44 1 42 4L35 15C32 13 28 12 25 12C17 12 10 17 8 25C3 26 0 30 0 35C0 38 1 41 3 43C1 46 0 49 0 52C0 60 5 67 13 69C13 74 16 77 21 78C22 86 29 91 37 91C40 91 44 90 46 88C48 90 51 91 54 91C62 91 69 86 71 78C76 77 79 73 79 69C87 67 92 60 92 52C92 49 91 46 89 43C91 41 92 38 92 35C92 30 89 26 84 25C82 17 75 12 67 12C64 12 60 13 57 15L50 4C48 1 45 0 42 0H50zM50 33C59.9 33 68 41.1 68 51C68 60.9 59.9 69 50 69C40.1 69 32 60.9 32 51C32 41.1 40.1 33 50 33z"/>
        <circle cx="50" cy="51" r="12" fill="#fff"/>
      </svg>`
    },
    { 
      id: 'stars', 
      name: 'Stars', 
      icon: '⭐', 
      price: 500,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>`
    },
    { 
      id: 'hearts', 
      name: 'Hearts', 
      icon: '❤️', 
      price: 500,
      svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
      </svg>`
    }
  ],
  backgrounds: [
    { id: 'modern-living', name: 'Modern Living Room', image: 'https://plus.unsplash.com/premium_photo-1683133752824-b9fd877805f3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'industrial', name: 'Industrial Space', image: 'https://plus.unsplash.com/premium_photo-1683133752824-b9fd877805f3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'bedroom', name: 'Cozy Bedroom', image: 'https://plus.unsplash.com/premium_photo-1683141389818-77fd3485334b?q=80&w=2138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dr' },
    { id: 'cafe', name: 'Cafe Wall', image: 'https://plus.unsplash.com/premium_photo-1683141389818-77fd3485334b?q=80&w=2138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'brick', name: 'Brick Wall', image: 'https://source.unsplash.com/featured/?brick,wall' }
  ],
  dimmerOptions: [
    { id: null, name: 'No Dimmer', icon: '❌' },
    { id: 'dimmer', name: 'Add Dimmer', icon: '🎛️', price: 800 }
  ],
  shapeOptions: [
    { id: 'cut-to-shape', name: 'Cut to Shape', icon: '✂️', price: 0 },
    { id: 'rectangle', name: 'Rectangle Box', icon: '⬜', price: 800 }
  ],
  usageOptions: [
    { id: 'indoor', name: 'Indoor', icon: '🏠', price: 0 },
    { id: 'outdoor', name: 'Outdoor', icon: '🌳', price: 1500 }
  ]
};

const defaultNeonOptions = {
  productType: 'neon',
  colors: [
    { name: 'Pink', value: '#ff69b4' },
    { name: 'Gold', value: '#ffd700' },
    { name: 'Purple', value: '#9370db' },
    { name: 'Teal', value: '#00ced1' },
    { name: 'Orange', value: '#ff7f50' },
    { name: 'Lime', value: '#32cd32' },
    { name: 'Rainbow', value: 'rainbow' }
  ],
  sizes: [
    { value: 'regular', name: 'Regular', width: 3, height: 10, price: 299 },
    { value: 'medium', name: 'Medium', width: 4, height: 10, price: 399 },
    { value: 'large', name: 'Large', width: 5, height: 10, price: 499 }
  ],
  fonts: [
    { name: 'Passionate', class: 'font-dancing-script', font: 'Dancing Script' },
    { name: 'Dreamy', class: 'font-great-vibes', font: 'Great Vibes' },
    { name: 'Flowy', class: 'font-parisienne', font: 'Parisienne' },
    { name: 'Original', class: 'font-fredoka', font: 'Fredoka' },
    { name: 'Classic', class: 'font-georgia', font: 'Georgia' },
    { name: 'Boujee', class: 'font-playfair', font: 'Playfair Display' },
    { name: 'Funky', class: 'font-righteous', font: 'Righteous' },
    { name: 'Chic', class: 'font-poppins', font: 'Poppins' },
    { name: 'Delight', class: 'font-comfortaa', font: 'Comfortaa' },
    { name: 'Classy', class: 'font-cormorant', font: 'Cormorant Garamond' },
    { name: 'Romantic', class: 'font-alex-brush', font: 'Alex Brush' },
    { name: 'Robo', class: 'font-orbitron', font: 'Orbitron' },
    { name: 'Charming', class: 'font-merienda', font: 'Merienda' },
    { name: 'Quirky', class: 'font-gloria-hallelujah', font: 'Gloria Hallelujah' },
    { name: 'Stylish', class: 'font-montserrat', font: 'Montserrat' },
    { name: 'Sassy', class: 'font-lobster', font: 'Lobster' },
    { name: 'Glam', class: 'font-aboreto', font: 'Aboreto' },
    { name: 'DOPE', class: 'font-anton', font: 'Anton' },
    { name: 'Chemistry', class: 'font-nunito', font: 'Nunito' },
    { name: 'Acoustic', class: 'font-patrick-hand', font: 'Patrick Hand' },
    { name: 'Sparky', class: 'font-bungee', font: 'Bungee' },
    { name: 'Vibey', class: 'font-rajdhani', font: 'Rajdhani' },
    { name: 'LoFi', class: 'font-share-tech-mono', font: 'Share Tech Mono' },
    { name: 'Bossy', class: 'font-bebas-neue', font: 'Bebas Neue' },
    { name: 'ICONIC', class: 'font-black-han-sans', font: 'Black Han Sans' },
    { name: 'Jolly', class: 'font-chewy', font: 'Chewy' },
    { name: 'MODERN', class: 'font-urbanist', font: 'Urbanist' }
  ],
  addOns: [
    { 
      id: 'crown', 
      name: 'Crown', 
      icon: '👑', 
      price: 500,
      image: '/crown.jpg'
    },
    { 
      id: 'heart', 
      name: 'Heart', 
      icon: '❤️', 
      price: 500,
      image: '/heart.jpg'
    },
    { 
      id: 'butterfly', 
      name: 'Butterfly', 
      icon: '🦋', 
      price: 500,
      image: '/butterfly.jpg'
    }
  ],
  backgrounds: [
    { id: 'modern-living', name: 'Modern Living Room', image: 'https://plus.unsplash.com/premium_photo-1683133752824-b9fd877805f3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'industrial', name: 'Industrial Space', image: 'https://plus.unsplash.com/premium_photo-1683133752824-b9fd877805f3?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'bedroom', name: 'Cozy Bedroom', image: 'https://plus.unsplash.com/premium_photo-1683141389818-77fd3485334b?q=80&w=2138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3Dr' },
    { id: 'cafe', name: 'Cafe Wall', image: 'https://plus.unsplash.com/premium_photo-1683141389818-77fd3485334b?q=80&w=2138&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D' },
    { id: 'brick', name: 'Brick Wall', image: 'https://source.unsplash.com/featured/?brick,wall' }
  ],
  dimmerOptions: [
    { id: false, name: 'No', icon: '❌' },
    { id: true, name: 'Yes', icon: '✅', price: 800 }
  ],
  shapeOptions: [
    { id: 'cut-to-shape', name: 'Cut to Shape', icon: '✂️', price: 0 },
    { id: 'rectangle', name: 'Rectangle Box', icon: '⬜', price: 800 }
  ],
  usageOptions: [
    { id: 'indoor', name: 'Indoor', icon: '🏠', price: 0 },
    { id: 'outdoor', name: 'Outdoor', icon: '🌳', price: 1500 }
  ]
};

async function initializeCustomizationOptions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    // Check if options already exist
    const existingFloro = await CustomizationOptions.findOne({ productType: 'floro' });
    const existingNeon = await CustomizationOptions.findOne({ productType: 'neon' });

    if (!existingFloro) {
      const floroOptions = new CustomizationOptions(defaultFloroOptions);
      await floroOptions.save();
      console.log('✅ Floro customization options initialized');
    } else {
      console.log('ℹ️ Floro customization options already exist');
    }

    if (!existingNeon) {
      const neonOptions = new CustomizationOptions(defaultNeonOptions);
      await neonOptions.save();
      console.log('✅ Neon customization options initialized');
    } else {
      console.log('ℹ️ Neon customization options already exist');
    }

    console.log('🎉 Customization options initialization completed!');
  } catch (error) {
    console.error('❌ Error initializing customization options:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the initialization
initializeCustomizationOptions(); 