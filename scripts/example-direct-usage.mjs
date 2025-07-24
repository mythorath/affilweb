#!/usr/bin/env node

// Example of using the generateProductReviews function directly
import generateProductReviews from './generateReviews.mjs';

// Example products data
const products = [
  {
    name: "Logitech MX Master 3S",
    price: "$99.99",
    description: "Advanced wireless mouse with precision tracking and customizable controls",
    features: [
      "4000 DPI Darkfield sensor",
      "Electromagnetic scroll wheel",
      "USB-C fast charging",
      "Multi-device connectivity",
      "Customizable buttons"
    ],
    brand: "Logitech"
  },
  {
    name: "Apple Magic Keyboard",
    price: "$129",
    description: "Wireless keyboard with scissor mechanism and numeric keypad",
    features: [
      "Scissor mechanism keys",
      "Numeric keypad",
      "Lightning charging",
      "Automatic pairing",
      "Low profile design"
    ],
    brand: "Apple"
  }
];

// Configuration options
const options = {
  category: "computer accessories",
  wordCount: "180-220",
  tone: "enthusiastic and informative",
  includeAffiliate: true,
  batchSize: 2
};

// Generate reviews
console.log('🚀 Starting direct function example...');

try {
  const reviewedProducts = await generateProductReviews(products, options);
  
  console.log('\\n📝 Generated Reviews:\\n');
  
  reviewedProducts.forEach((product, index) => {
    console.log(`${index + 1}. **${product.name}**`);
    console.log(`Price: ${product.price}`);
    console.log(`Review:`);
    console.log(product.review);
    console.log('\\n' + '─'.repeat(80) + '\\n');
  });
  
  console.log('✅ Example completed successfully!');
  
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
