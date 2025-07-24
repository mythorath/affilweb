#!/usr/bin/env node
/**
 * Tierlist Auto-Enhancer with SerpAPI Image Generation
 * 
 * This script automatically enhances tierlist MDX files by adding missing product images
 * using SerpAPI Google Images search. It processes existing tierlist files and adds
 * high-quality product images from retail domains when the image field is missing.
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fetchImageFromSerpAPI } from '../src/utils/imageSearch.js';

// Load environment variables
dotenv.config();

/**
 * Enhances a tierlist file with missing product images using SerpAPI
 * @param {string} filePath - Path to the tierlist MDX file
 * @returns {Promise<boolean>} True if file was enhanced, false if no changes needed
 */
export async function enhanceTierlistWithImages(filePath) {
  console.log(`🔍 Enhancing tierlist: ${path.basename(filePath)}`);
  
  try {
    // Read the MDX file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract the TierList component content
    const tierListMatch = content.match(/<TierList\s+tiers=\{\{([\s\S]*?)\}\}\s*\/>/);
    
    if (!tierListMatch) {
      console.log(`⚠️  No TierList component found in ${path.basename(filePath)}`);
      return false;
    }
    
    // Parse the tiers object (this is a simplified parser for the specific format)
    const tiersContent = tierListMatch[1];
    
    // Extract tier data more safely
    let tiersData;
    try {
      // Create a safe evaluation context
      const tierListComponent = `<TierList tiers={{${tiersContent}}} />`;
      tiersData = extractTiersFromContent(tiersContent);
    } catch (error) {
      console.error(`❌ Failed to parse tiers data in ${path.basename(filePath)}:`, error.message);
      return false;
    }
    
    let hasChanges = false;
    const enhancedTiers = {};
    
    // Process each tier
    for (const [tierName, products] of Object.entries(tiersData)) {
      console.log(`📊 Processing tier ${tierName} (${products.length} products)`);
      enhancedTiers[tierName] = [];
      
      for (const product of products) {
        let enhancedProduct = { ...product };
        
        // Check if image is missing or empty
        if (!product.image || product.image.trim() === '') {
          console.log(`🔍 Fetching image for: "${product.name}"`);
          
          try {
            const imageResult = await fetchImageFromSerpAPI(product.name);
            
            if (imageResult.url) {
              enhancedProduct.image = imageResult.url;
              enhancedProduct.imageSource = imageResult.source;
              hasChanges = true;
              
              console.log(`✅ Added image for "${product.name}": ${imageResult.url.substring(0, 60)}... (${imageResult.source})`);
            } else {
              console.log(`❌ No image found for "${product.name}"`);
              // Keep product without image
            }
          } catch (error) {
            console.error(`❌ Error fetching image for "${product.name}":`, error.message);
            // Keep product without image
          }
          
          // Add delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`✅ Image already exists for "${product.name}"`);
        }
        
        enhancedTiers[tierName].push(enhancedProduct);
      }
    }
    
    if (hasChanges) {
      // Generate new TierList component with enhanced data
      const newTierListComponent = generateTierListComponent(enhancedTiers);
      
      // Replace the TierList component in the content
      const newContent = content.replace(
        /<TierList\s+tiers=\{\{[\s\S]*?\}\}\s*\/>/,
        newTierListComponent
      );
      
      // Write the enhanced file
      await fs.writeFile(filePath, newContent, 'utf8');
      
      console.log(`✅ Enhanced ${path.basename(filePath)} with new images`);
      return true;
    } else {
      console.log(`✅ No enhancement needed for ${path.basename(filePath)} - all images present`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error enhancing ${path.basename(filePath)}:`, error.message);
    return false;
  }
}

/**
 * Extracts tiers data from the TierList component content
 * @private
 * @param {string} tiersContent - The content inside the tiers={{...}} prop
 * @returns {Object} Parsed tiers data
 */
function extractTiersFromContent(tiersContent) {
  // This is a simplified parser for our specific MDX format
  // In a production environment, you might want to use a proper JS parser
  
  const tiers = {};
  
  // Match tier definitions like "S": [...], "A": [...], etc.
  const tierMatches = tiersContent.match(/"([^"]+)":\s*\[([\s\S]*?)\](?=\s*,\s*"|\s*$)/g);
  
  if (!tierMatches) {
    throw new Error('No tier definitions found');
  }
  
  for (const tierMatch of tierMatches) {
    const [, tierName, productsContent] = tierMatch.match(/"([^"]+)":\s*\[([\s\S]*?)\]/);
    
    // Parse products within this tier
    const products = [];
    
    // Match individual product objects
    const productMatches = productsContent.match(/\{[^}]*\}/g) || [];
    
    for (const productMatch of productMatches) {
      const product = {};
      
      // Extract properties (name, review, link, image, etc.)
      const nameMatch = productMatch.match(/name:\s*"([^"]+)"/);
      const reviewMatch = productMatch.match(/review:\s*"([^"]+)"/);
      const linkMatch = productMatch.match(/link:\s*"([^"]+)"/);
      const imageMatch = productMatch.match(/image:\s*"([^"]*)"/);
      const imageSourceMatch = productMatch.match(/imageSource:\s*"([^"]*)"/);
      
      if (nameMatch) product.name = nameMatch[1];
      if (reviewMatch) product.review = reviewMatch[1];
      if (linkMatch) product.link = linkMatch[1];
      if (imageMatch) product.image = imageMatch[1];
      if (imageSourceMatch) product.imageSource = imageSourceMatch[1];
      
      if (product.name) {
        products.push(product);
      }
    }
    
    tiers[tierName] = products;
  }
  
  return tiers;
}

/**
 * Generates a new TierList component with enhanced tiers data
 * @private
 * @param {Object} tiersData - Enhanced tiers data
 * @returns {string} New TierList component string
 */
function generateTierListComponent(tiersData) {
  const tiersString = Object.entries(tiersData).map(([tierName, products]) => {
    const productsString = products.map(product => {
      const props = [`name: "${product.name}"`];
      
      if (product.review) props.push(`review: "${product.review}"`);
      if (product.link) props.push(`link: "${product.link}"`);
      if (product.image) props.push(`image: "${product.image}"`);
      if (product.imageSource) props.push(`imageSource: "${product.imageSource}"`);
      
      return `      { ${props.join(', ')} }`;
    }).join(',\n');
    
    return `    "${tierName}": [\n${productsString}\n    ]`;
  }).join(',\n');
  
  return `<TierList\n  tiers={{\n${tiersString}\n  }}\n/>`;
}

/**
 * Enhances all tierlist files in the content directory
 * @param {string} contentDir - Path to the tierlists content directory
 * @returns {Promise<void>}
 */
export async function enhanceAllTierlists(contentDir = 'src/content/tierlists') {
  console.log('🚀 Starting tierlist auto-enhancement with SerpAPI...\n');
  
  try {
    const files = await fs.readdir(contentDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    if (mdxFiles.length === 0) {
      console.log('❌ No MDX files found in tierlists directory');
      return;
    }
    
    console.log(`📁 Found ${mdxFiles.length} tierlist files to process\n`);
    
    let enhancedCount = 0;
    
    for (const file of mdxFiles) {
      const filePath = path.join(contentDir, file);
      const wasEnhanced = await enhanceTierlistWithImages(filePath);
      
      if (wasEnhanced) {
        enhancedCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`🎉 Auto-enhancement complete!`);
    console.log(`📊 Enhanced ${enhancedCount} out of ${mdxFiles.length} tierlist files`);
    
    if (enhancedCount > 0) {
      console.log('\n💡 Tip: Review the enhanced files and commit the changes to save the new images');
    }
    
  } catch (error) {
    console.error('❌ Error during auto-enhancement:', error.message);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Enhance specific file
    const filePath = args[0];
    enhanceTierlistWithImages(filePath)
      .then(wasEnhanced => {
        if (wasEnhanced) {
          console.log(`✅ Successfully enhanced ${path.basename(filePath)}`);
        } else {
          console.log(`ℹ️  No changes needed for ${path.basename(filePath)}`);
        }
      })
      .catch(console.error);
  } else {
    // Enhance all files
    enhanceAllTierlists().catch(console.error);
  }
}
