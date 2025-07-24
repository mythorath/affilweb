#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fetchAmazonImage, extractASIN, fetchProductImageFallback } from '../src/utils/amazon.js';

/**
 * Enhanced script to add images with source tracking to tierlist MDX files
 * Addresses requirement: "Log Image Source Type in Output JSON"
 */

/**
 * Extract Amazon links from MDX tierlist files and add images with source tracking
 * @param {string} content - MDX file content
 * @returns {Object} Processing results with source tracking
 */
function extractProductsFromMDX(content) {
  const products = [];
  
  // Match tier sections and extract products
  const tierRegex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
  let tierMatch;
  
  while ((tierMatch = tierRegex.exec(content)) !== null) {
    const tier = tierMatch[1];
    const tierContent = tierMatch[2];
    
    // Extract individual products from tier
    const productRegex = /{\s*name:\s*"([^"]+)",[\s\S]*?link:\s*"([^"]+)"\s*}/g;
    let productMatch;
    
    while ((productMatch = productRegex.exec(tierContent)) !== null) {
      const [, name, link] = productMatch;
      
      if (link.includes('amazon.') || link.includes('amzn.')) {
        products.push({
          name,
          link,
          tier,
          asin: extractASIN(link),
          originalText: productMatch[0] // Store original for replacement
        });
      }
    }
  }
  
  return products;
}

/**
 * Add images with source tracking to tierlist MDX file
 * @param {string} filePath - Path to MDX file
 */
async function addImagesWithSourceTracking(filePath) {
  try {
    console.log(`\n📄 Processing: ${path.basename(filePath)}`);
    console.log('─'.repeat(60));
    
    const content = await fs.readFile(filePath, 'utf-8');
    const products = extractProductsFromMDX(content);
    
    if (products.length === 0) {
      console.log('❌ No Amazon products found in this file');
      return;
    }
    
    console.log(`✅ Found ${products.length} Amazon products\n`);
    
    let updatedContent = content;
    const processingResults = {
      total: products.length,
      successful: 0,
      failed: 0,
      sources: {}
    };
    
    for (const product of products) {
      console.log(`🔍 Processing: ${product.name} (Tier ${product.tier})`);
      
      let imageResult = { url: null, source: 'none' };
      
      try {
        // Try ASIN-based lookup first if available
        if (product.asin) {
          console.log(`   ASIN: ${product.asin}`);
          imageResult = await fetchAmazonImage(product.asin);
        } else {
          console.log(`   No ASIN - using product name fallback`);
          imageResult = await fetchProductImageFallback(product.name);
        }
        
        if (imageResult.url) {
          console.log(`   ✅ SUCCESS: Found image (Source: ${imageResult.source})`);
          console.log(`   📷 URL: ${imageResult.url.substring(0, 60)}...`);
          
          // Track source statistics
          processingResults.sources[imageResult.source] = (processingResults.sources[imageResult.source] || 0) + 1;
          processingResults.successful++;
          
          // Add image and imageSource fields to the product object
          const newProductText = product.originalText
            .replace(/}$/, `,\n        image: "${imageResult.url}",\n        imageSource: "${imageResult.source}"\n      }`);
          
          updatedContent = updatedContent.replace(product.originalText, newProductText);
          
        } else {
          console.log(`   ❌ FAILED: No image found (Source: ${imageResult.source})`);
          processingResults.failed++;
          
          // Add imageSource field even for failed attempts for tracking
          const newProductText = product.originalText
            .replace(/}$/, `,\n        imageSource: "none"\n      }`);
          
          updatedContent = updatedContent.replace(product.originalText, newProductText);
        }
        
      } catch (error) {
        console.error(`   💥 ERROR: ${error.message}`);
        processingResults.failed++;
        
        // Add error tracking
        const newProductText = product.originalText
          .replace(/}$/, `,\n        imageSource: "error"\n      }`);
        
        updatedContent = updatedContent.replace(product.originalText, newProductText);
      }
      
      console.log('');
      
      // Add delay to be respectful to APIs
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Write updated content back to file
    await fs.writeFile(filePath, updatedContent, 'utf-8');
    
    console.log('📊 Processing Summary:');
    console.log(`   Total Products: ${processingResults.total}`);
    console.log(`   Successfully Enhanced: ${processingResults.successful}`);
    console.log(`   Failed: ${processingResults.failed}`);
    console.log(`   Success Rate: ${((processingResults.successful / processingResults.total) * 100).toFixed(1)}%`);
    
    console.log('\n📈 Image Source Breakdown:');
    for (const [source, count] of Object.entries(processingResults.sources)) {
      const sourceNames = {
        'amazon_cdn': 'Amazon CDN',
        'amazon_scraping': 'Amazon Scraping',
        'search_engine_retail': 'Search Engine (Retail)',
        'search_engine': 'Search Engine (Generic)',
        'duckduckgo': 'DuckDuckGo API',
        'unsplash': 'Unsplash Stock',
        'wikipedia': 'Wikipedia',
        'none': 'No Image Found',
        'error': 'Processing Error'
      };
      
      console.log(`   ${sourceNames[source] || source}: ${count} products`);
    }
    
    // Check for missing images and log warnings
    if (processingResults.failed > 0) {
      console.log(`\n⚠️  Warning: ${processingResults.failed} products still missing images`);
      console.log('   Consider manual review or alternative image sources');
    }
    
    console.log(`\n✅ Updated file: ${filePath}`);
    
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error.message);
  }
}

/**
 * Main function to process all tierlist files or specific file
 */
async function main() {
  const args = process.argv.slice(2);
  
  console.log('🖼️  Enhanced Amazon Image Addition with Source Tracking\n');
  console.log('📋 This script adds:');
  console.log('   • Product images from multiple sources');
  console.log('   • Source tracking for each image (imageSource field)');
  console.log('   • Comprehensive statistics and warnings');
  
  if (args.length > 0) {
    // Process specific file
    const filePath = args[0];
    if (await fs.access(filePath).then(() => true).catch(() => false)) {
      await addImagesWithSourceTracking(filePath);
    } else {
      console.error(`❌ File not found: ${filePath}`);
    }
  } else {
    // Process all tierlist files
    const tierlistDir = 'src/content/tierlists';
    
    try {
      const files = await fs.readdir(tierlistDir);
      const mdxFiles = files.filter(file => file.endsWith('.mdx'));
      
      if (mdxFiles.length === 0) {
        console.log('❌ No MDX tierlist files found');
        return;
      }
      
      console.log(`\n📁 Found ${mdxFiles.length} tierlist files to process\n`);
      
      for (const file of mdxFiles) {
        const filePath = path.join(tierlistDir, file);
        await addImagesWithSourceTracking(filePath);
        
        // Add delay between files
        if (file !== mdxFiles[mdxFiles.length - 1]) {
          console.log('\n⏳ Waiting before next file...\n');
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      }
      
      console.log('\n🎉 All tierlist files processed with enhanced image tracking!');
      
    } catch (error) {
      console.error('Failed to read tierlist directory:', error.message);
    }
  }
}

// Handle command line arguments
if (process.argv.length > 2) {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📖 Enhanced Image Addition Script Usage:

   node scripts/add-images-with-tracking.mjs [file.mdx] [options]

🔧 Options:
   --help, -h     Show this help message
   
📝 Examples:
   node scripts/add-images-with-tracking.mjs
                  # Process all tierlist files
                  
   node scripts/add-images-with-tracking.mjs src/content/tierlists/best-headsets.mdx
                  # Process specific file
                  
🆕 New Features:
   • Enhanced search engine integration with retail domain priority
   • Comprehensive image source tracking (imageSource field)
   • Detailed statistics and processing summaries
   • Missing image warnings for build process integration
   • Support for multiple fallback strategies
    `);
    process.exit(0);
  }
}

main().catch(console.error);
