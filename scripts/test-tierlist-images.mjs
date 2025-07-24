#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fetchAmazonImage, extractASIN, fetchProductImageFallback } from '../src/utils/amazon.js';

/**
 * Extract Amazon links from MDX tierlist files
 * @param {string} content - MDX file content
 * @returns {Array} Array of products with Amazon links
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
          asin: extractASIN(link)
        });
      }
    }
  }
  
  return products;
}

/**
 * Test image fetching for products found in MDX files
 * @param {string} filePath - Path to MDX file
 */
async function testImagesForMDX(filePath) {
  try {
    console.log(`\n📄 Analyzing: ${path.basename(filePath)}`);
    console.log('─'.repeat(60));
    
    const content = await fs.readFile(filePath, 'utf-8');
    const products = extractProductsFromMDX(content);
    
    if (products.length === 0) {
      console.log('❌ No Amazon products found in this file');
      return;
    }
    
    console.log(`✅ Found ${products.length} Amazon products\n`);
    
    for (const product of products) {
      console.log(`🎮 Testing: ${product.name} (Tier ${product.tier})`);
      
      if (!product.asin) {
        console.log('ℹ️  No ASIN found - testing with product name fallback');
        console.log(`   Link: ${product.link}`);
        
        try {
          const startTime = Date.now();
          const imageResult = await fetchProductImageFallback(product.name);
          const endTime = Date.now();
          
          if (imageResult.url) {
            console.log(`✅ SUCCESS: Found fallback image in ${endTime - startTime}ms`);
            console.log(`📷 Image URL: ${imageResult.url.substring(0, 80)}...`);
            console.log(`📊 Image Source: ${imageResult.source}`);
            
            // Determine image source type for display
            if (imageResult.source === 'search_engine_retail') {
              console.log('🛒 Source: Search Engine (Retail Domain)');
            } else if (imageResult.source === 'search_engine') {
              console.log('🔍 Source: Search Engine (Generic)');
            } else if (imageResult.source === 'unsplash') {
              console.log('📸 Source: Unsplash');
            } else if (imageResult.source === 'duckduckgo') {
              console.log('🦆 Source: DuckDuckGo');
            } else if (imageResult.source === 'wikipedia') {
              console.log('📖 Source: Wikipedia');
            } else {
              console.log(`🌐 Source: ${imageResult.source}`);
            }
          } else {
            console.log(`❌ FAILED: No fallback image found in ${endTime - startTime}ms (Source: ${imageResult.source})`);
          }
        } catch (error) {
          console.error(`💥 ERROR: ${error.message}`);
        }
        
        console.log('');
        continue;
      }
      
      console.log(`🔍 ASIN: ${product.asin}`);
      
      try {
        const startTime = Date.now();
        const imageResult = await fetchAmazonImage(product.asin);
        const endTime = Date.now();
        
        if (imageResult.url) {
          console.log(`✅ SUCCESS: Found image in ${endTime - startTime}ms`);
          console.log(`📷 Image URL: ${imageResult.url.substring(0, 80)}...`);
          console.log(`📊 Image Source: ${imageResult.source}`);
          
          // Display source type
          if (imageResult.source === 'amazon_cdn') {
            console.log('🛒 Source: Amazon CDN');
          } else if (imageResult.source === 'amazon_scraping') {
            console.log('� Source: Amazon Scraping');
          } else if (imageResult.source === 'search_engine_retail') {
            console.log('🛒 Source: Search Engine (Retail)');
          } else if (imageResult.source === 'unsplash') {
            console.log('� Source: Unsplash Fallback');
          } else {
            console.log(`🔄 Source: ${imageResult.source}`);
          }
        } else {
          console.log(`❌ FAILED: No image found in ${endTime - startTime}ms (Source: ${imageResult.source})`);
        }
      } catch (error) {
        console.error(`💥 ERROR: ${error.message}`);
      }
      
      console.log('');
      
      // Add delay to be respectful to APIs
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
  } catch (error) {
    console.error(`Failed to process ${filePath}:`, error.message);
  }
}

/**
 * Test image fetching for all tierlist files
 */
async function testAllTierlistImages() {
  console.log('🧪 Testing Amazon Image Fetching for Tierlist Files\n');
  
  const tierlistDir = 'src/content/tierlists';
  
  try {
    const files = await fs.readdir(tierlistDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    if (mdxFiles.length === 0) {
      console.log('❌ No MDX tierlist files found');
      return;
    }
    
    console.log(`📋 Found ${mdxFiles.length} tierlist files to analyze\n`);
    
    for (const file of mdxFiles) {
      const filePath = path.join(tierlistDir, file);
      await testImagesForMDX(filePath);
      
      // Add delay between files
      if (file !== mdxFiles[mdxFiles.length - 1]) {
        console.log('⏳ Waiting before next file...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    console.log('🎉 Image testing completed for all tierlist files!');
    
  } catch (error) {
    console.error('Failed to read tierlist directory:', error.message);
  }
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.length > 0) {
  // Test specific file
  const filePath = args[0];
  if (filePath.endsWith('.mdx')) {
    testImagesForMDX(filePath);
  } else {
    console.log('❌ Please provide an MDX file');
    console.log('Usage: node test-tierlist-images.mjs [file.mdx]');
    console.log('       node test-tierlist-images.mjs  (test all files)');
  }
} else {
  // Test all files
  testAllTierlistImages();
}
