#!/usr/bin/env node

// Utility to add AI-generated reviews to existing tierlist JSON files
import fs from 'fs/promises';
import path from 'path';
import generateProductReviews from './generateReviews.mjs';

/**
 * Enhances a tierlist JSON file by adding AI-generated reviews to products
 * @param {string} tierlistFile - Path to the tierlist JSON file
 * @param {Object} options - Review generation options
 */
async function enhanceTierlistWithReviews(tierlistFile, options = {}) {
  try {
    console.log(`🔄 Enhancing tierlist: ${tierlistFile}`);
    
    // Read the tierlist file
    const filePath = path.resolve(tierlistFile);
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const tierlistData = JSON.parse(fileContent);
    
    // Extract all products from all tiers
    const allProducts = [];
    
    if (tierlistData.tiers && typeof tierlistData.tiers === 'object') {
      // Handle tier structure with direct tier keys (S, A, B, etc.)
      for (const tierKey of Object.keys(tierlistData.tiers)) {
        const tierItems = tierlistData.tiers[tierKey];
        if (Array.isArray(tierItems)) {
          allProducts.push(...tierItems);
        }
      }
    } else if (tierlistData.tiers && Array.isArray(tierlistData.tiers)) {
      // Handle tier structure with array of tier objects
      for (const tier of tierlistData.tiers) {
        if (tier.items && Array.isArray(tier.items)) {
          allProducts.push(...tier.items);
        }
      }
    }
    
    if (allProducts.length === 0) {
      console.log('⚠️  No products found in tierlist');
      return;
    }
    
    console.log(`📦 Found ${allProducts.length} products across all tiers`);
    
    // Set up review options based on tierlist metadata
    const reviewOptions = {
      category: tierlistData.category || 'products',
      wordCount: '150-250',
      tone: 'professional and helpful',
      includeAffiliate: true,
      batchSize: 3,
      ...options
    };
    
    console.log(`⚙️  Using review options:`, reviewOptions);
    
    // Generate reviews for all products
    const productsWithReviews = await generateProductReviews(allProducts, reviewOptions);
    
    // Update the tierlist data with reviews
    let productIndex = 0;
    
    if (typeof tierlistData.tiers === 'object' && !Array.isArray(tierlistData.tiers)) {
      // Handle tier structure with direct tier keys (S, A, B, etc.)
      for (const tierKey of Object.keys(tierlistData.tiers)) {
        const tierItems = tierlistData.tiers[tierKey];
        if (Array.isArray(tierItems)) {
          for (let i = 0; i < tierItems.length; i++) {
            tierItems[i] = productsWithReviews[productIndex];
            productIndex++;
          }
        }
      }
    } else if (Array.isArray(tierlistData.tiers)) {
      // Handle tier structure with array of tier objects
      for (const tier of tierlistData.tiers) {
        if (tier.items && Array.isArray(tier.items)) {
          for (let i = 0; i < tier.items.length; i++) {
            tier.items[i] = productsWithReviews[productIndex];
            productIndex++;
          }
        }
      }
    }
    
    // Add metadata about review generation
    tierlistData.metadata = {
      ...tierlistData.metadata,
      reviewsGenerated: true,
      reviewsGeneratedAt: new Date().toISOString(),
      reviewOptions: reviewOptions
    };
    
    // Save the enhanced tierlist
    const outputFile = tierlistFile.replace('.json', '-with-reviews.json');
    await fs.writeFile(outputFile, JSON.stringify(tierlistData, null, 2), 'utf-8');
    
    console.log(`💾 Enhanced tierlist saved to: ${outputFile}`);
    console.log(`🎉 Successfully added reviews to ${allProducts.length} products!`);
    
    return tierlistData;
    
  } catch (error) {
    console.error('❌ Error enhancing tierlist:', error.message);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node enhanceTierlistWithReviews.mjs <tierlist-file.json>

Example: node enhanceTierlistWithReviews.mjs best-office-chairs-2025.json

This will:
1. Read the tierlist JSON file
2. Extract all products from all tiers
3. Generate AI reviews for each product
4. Save enhanced tierlist as "*-with-reviews.json"
`);
    process.exit(1);
  }
  
  const [tierlistFile] = args;
  enhanceTierlistWithReviews(tierlistFile);
}

export default enhanceTierlistWithReviews;
