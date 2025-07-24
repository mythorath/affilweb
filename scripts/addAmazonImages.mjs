#!/usr/bin/env node

// Utility to automatically fetch Amazon images and add them to tierlist JSON files
import fs from 'fs/promises';
import path from 'path';
import { fetchAmazonImage, extractASIN } from '../src/utils/amazon.js';

/**
 * Adds Amazon product images to a tierlist JSON file by extracting ASINs from affiliate links
 * @param {string} jsonFilePath - Path to the tierlist JSON file
 * @param {Object} options - Configuration options
 */
async function addAmazonImagesToTierlist(jsonFilePath, options = {}) {
  const { 
    overwrite = false, 
    delay = 1000,
    dryRun = false 
  } = options;

  try {
    console.log(`🔄 Processing tierlist: ${jsonFilePath}`);
    
    // Read the JSON file
    const fileContent = await fs.readFile(jsonFilePath, 'utf-8');
    const tierlistData = JSON.parse(fileContent);
    
    if (!tierlistData.tiers || typeof tierlistData.tiers !== 'object') {
      throw new Error('Invalid tierlist format: missing tiers object');
    }

    let totalProducts = 0;
    let imagesAdded = 0;
    let imagesFailed = 0;

    // Process each tier
    for (const [tierName, products] of Object.entries(tierlistData.tiers)) {
      if (!Array.isArray(products)) continue;

      console.log(`\n📂 Processing tier ${tierName}...`);

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        totalProducts++;

        // Skip if image already exists and not overwriting
        if (product.image && !overwrite) {
          console.log(`  ⏭️  ${product.name} - Image already exists`);
          continue;
        }

        // Try to extract ASIN from the affiliate link
        const asin = extractASIN(product.link);
        if (!asin) {
          console.log(`  ❌ ${product.name} - Could not extract ASIN from: ${product.link}`);
          imagesFailed++;
          continue;
        }

        console.log(`  🔍 ${product.name} - Fetching image for ASIN: ${asin}`);

        if (!dryRun) {
          try {
            const imageUrl = await fetchAmazonImage(asin);
            if (imageUrl) {
              product.image = imageUrl;
              imagesAdded++;
              console.log(`  ✅ ${product.name} - Image added`);
            } else {
              imagesFailed++;
              console.log(`  ❌ ${product.name} - No image found`);
            }

            // Rate limiting delay
            if (i < products.length - 1) {
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          } catch (error) {
            imagesFailed++;
            console.error(`  💥 ${product.name} - Error: ${error.message}`);
          }
        } else {
          console.log(`  🔍 ${product.name} - Would fetch image for ASIN: ${asin} (dry run)`);
        }
      }
    }

    // Save the updated file
    if (!dryRun && imagesAdded > 0) {
      const outputPath = jsonFilePath.replace('.json', '-with-images.json');
      await fs.writeFile(outputPath, JSON.stringify(tierlistData, null, 2), 'utf-8');
      console.log(`\n💾 Updated tierlist saved to: ${outputPath}`);
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`  Total products: ${totalProducts}`);
    console.log(`  Images added: ${imagesAdded}`);
    console.log(`  Images failed: ${imagesFailed}`);

    if (dryRun) {
      console.log('\n🏃 This was a dry run - no files were modified');
    }

    return {
      totalProducts,
      imagesAdded,
      imagesFailed,
      success: imagesFailed < totalProducts
    };

  } catch (error) {
    console.error('❌ Error processing tierlist:', error.message);
    throw error;
  }
}

/**
 * Batch process multiple tierlist files
 * @param {string[]} filePaths - Array of JSON file paths
 * @param {Object} options - Configuration options
 */
async function batchAddImages(filePaths, options = {}) {
  console.log(`🔄 Batch processing ${filePaths.length} tierlist files...\n`);

  const results = [];
  
  for (let i = 0; i < filePaths.length; i++) {
    const filePath = filePaths[i];
    console.log(`📁 Processing file ${i + 1}/${filePaths.length}: ${path.basename(filePath)}`);
    
    try {
      const result = await addAmazonImagesToTierlist(filePath, options);
      results.push({ filePath, ...result });
    } catch (error) {
      console.error(`❌ Failed to process ${filePath}:`, error.message);
      results.push({ filePath, success: false, error: error.message });
    }

    // Delay between files
    if (i < filePaths.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Overall summary
  console.log('\n🎉 Batch processing complete!');
  console.log(`✅ Successfully processed: ${results.filter(r => r.success).length}/${results.length} files`);
  
  return results;
}

// CLI interface
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node addAmazonImages.mjs <tierlist-file.json> [options]

Options:
  --overwrite     Overwrite existing images
  --delay <ms>    Delay between requests (default: 1000ms)
  --dry-run       Show what would be done without making changes

Examples:
  node addAmazonImages.mjs best-office-chairs.json
  node addAmazonImages.mjs best-headphones.json --overwrite --delay 2000
  node addAmazonImages.mjs *.json --dry-run
`);
    process.exit(1);
  }

  // Parse arguments
  const files = args.filter(arg => !arg.startsWith('--'));
  const overwrite = args.includes('--overwrite');
  const dryRun = args.includes('--dry-run');
  const delayIndex = args.indexOf('--delay');
  const delay = delayIndex > -1 && args[delayIndex + 1] ? parseInt(args[delayIndex + 1]) : 1000;

  const options = { overwrite, delay, dryRun };

  if (files.length === 1) {
    addAmazonImagesToTierlist(files[0], options)
      .then(() => console.log('✅ Complete!'))
      .catch(error => {
        console.error('❌ Failed:', error.message);
        process.exit(1);
      });
  } else {
    batchAddImages(files, options)
      .then(() => console.log('✅ Batch complete!'))
      .catch(error => {
        console.error('❌ Batch failed:', error.message);
        process.exit(1);
      });
  }
}

export { addAmazonImagesToTierlist, batchAddImages };
