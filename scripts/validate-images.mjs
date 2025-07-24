#!/usr/bin/env node

// Debug: Script starting
console.log('🔧 Image validation script starting...');

import fs from 'fs/promises';
import path from 'path';

/**
 * Build validation script that checks for missing images in tierlist files
 * Addresses requirement: "Add 'image missing' warnings to the build process"
 */

/**
 * Extract products from MDX content and check for missing images
 * @param {string} content - MDX file content
 * @returns {Object} Analysis results
 */
function analyzeProductImages(content) {
  const products = [];
  const analysis = {
    total: 0,
    withImages: 0,
    withoutImages: 0,
    missingProducts: [],
    sourceBreakdown: {}
  };

  // Match tier sections and extract products
  const tierRegex = /"([^"]+)":\s*\[([\s\S]*?)\]/g;
  let tierMatch;
  
  while ((tierMatch = tierRegex.exec(content)) !== null) {
    const tier = tierMatch[1];
    const tierContent = tierMatch[2];
    
    // Extract individual products from tier
    const productRegex = /{\s*name:\s*"([^"]+)"[\s\S]*?}/g;
    let productMatch;
    
    while ((productMatch = productRegex.exec(tierContent)) !== null) {
      const productText = productMatch[0];
      const name = productMatch[1];
      
      // Check for image field
      const hasImage = /image:\s*"([^"]+)"/.test(productText);
      const imageMatch = productText.match(/image:\s*"([^"]+)"/);
      const imageUrl = imageMatch ? imageMatch[1] : null;
      
      // Check for imageSource field
      const sourceMatch = productText.match(/imageSource:\s*"([^"]+)"/);
      const imageSource = sourceMatch ? sourceMatch[1] : 'unknown';
      
      const product = {
        name,
        tier,
        hasImage,
        imageUrl,
        imageSource
      };
      
      products.push(product);
      analysis.total++;
      
      if (hasImage && imageUrl && imageUrl !== '' && !imageUrl.includes('placeholder')) {
        analysis.withImages++;
        
        // Track image source breakdown
        analysis.sourceBreakdown[imageSource] = (analysis.sourceBreakdown[imageSource] || 0) + 1;
      } else {
        analysis.withoutImages++;
        analysis.missingProducts.push(product);
      }
    }
  }
  
  return { products, analysis };
}

/**
 * Validate a single tierlist file for missing images
 * @param {string} filePath - Path to MDX file
 * @returns {Object} Validation results
 */
async function validateTierlistImages(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const { products, analysis } = analyzeProductImages(content);
    
    return {
      file: path.basename(filePath),
      success: true,
      products,
      analysis
    };
  } catch (error) {
    return {
      file: path.basename(filePath),
      success: false,
      error: error.message
    };
  }
}

/**
 * Main validation function that checks all tierlist files
 */
async function validateAllTierlists() {
  console.log('🔍 Build Validation: Checking for Missing Product Images\n');
  
  const tierlistDir = 'src/content/tierlists';
  let overallStats = {
    totalFiles: 0,
    totalProducts: 0,
    productsWithImages: 0,
    productsWithoutImages: 0,
    sourceBreakdown: {},
    problemFiles: []
  };
  
  try {
    const files = await fs.readdir(tierlistDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    if (mdxFiles.length === 0) {
      console.log('❌ No MDX tierlist files found');
      process.exit(1);
    }
    
    console.log(`📁 Validating ${mdxFiles.length} tierlist files...\n`);
    overallStats.totalFiles = mdxFiles.length;
    
    for (const file of mdxFiles) {
      const filePath = path.join(tierlistDir, file);
      const result = await validateTierlistImages(filePath);
      
      if (!result.success) {
        console.log(`❌ ERROR processing ${result.file}: ${result.error}`);
        overallStats.problemFiles.push(result.file);
        continue;
      }
      
      const { analysis } = result;
      
      // Update overall statistics
      overallStats.totalProducts += analysis.total;
      overallStats.productsWithImages += analysis.withImages;
      overallStats.productsWithoutImages += analysis.withoutImages;
      
      // Merge source breakdown
      for (const [source, count] of Object.entries(analysis.sourceBreakdown)) {
        overallStats.sourceBreakdown[source] = (overallStats.sourceBreakdown[source] || 0) + count;
      }
      
      // Report file status
      const imagePercent = analysis.total > 0 ? ((analysis.withImages / analysis.total) * 100).toFixed(1) : 0;
      const status = analysis.withoutImages === 0 ? '✅' : '⚠️ ';
      
      console.log(`${status} ${result.file}`);
      console.log(`   Products: ${analysis.total} | With Images: ${analysis.withImages} (${imagePercent}%) | Missing: ${analysis.withoutImages}`);
      
      // List missing images
      if (analysis.missingProducts.length > 0) {
        console.log('   Missing Images:');
        for (const product of analysis.missingProducts) {
          console.log(`     • ${product.name} (Tier ${product.tier})`);
        }
      }
      
      console.log('');
    }
    
    // Overall summary
    console.log('📊 Overall Build Validation Summary');
    console.log('─'.repeat(50));
    console.log(`Total Files Processed: ${overallStats.totalFiles}`);
    console.log(`Total Products: ${overallStats.totalProducts}`);
    console.log(`Products with Images: ${overallStats.productsWithImages}`);
    console.log(`Products without Images: ${overallStats.productsWithoutImages}`);
    
    const overallPercent = overallStats.totalProducts > 0 ? 
      ((overallStats.productsWithImages / overallStats.totalProducts) * 100).toFixed(1) : 0;
    
    console.log(`Image Coverage: ${overallPercent}%`);
    
    // Image source breakdown
    if (Object.keys(overallStats.sourceBreakdown).length > 0) {
      console.log('\n📈 Image Source Breakdown:');
      const sourceNames = {
        'amazon_cdn': 'Amazon CDN',
        'amazon_scraping': 'Amazon Scraping',
        'search_engine_retail': 'Search Engine (Retail)',
        'search_engine': 'Search Engine (Generic)',
        'duckduckgo': 'DuckDuckGo API',
        'unsplash': 'Unsplash Stock',
        'wikipedia': 'Wikipedia',
        'none': 'No Image Found',
        'error': 'Processing Error',
        'unknown': 'Unknown Source'
      };
      
      for (const [source, count] of Object.entries(overallStats.sourceBreakdown)) {
        const sourceName = sourceNames[source] || source;
        const sourcePercent = ((count / overallStats.productsWithImages) * 100).toFixed(1);
        console.log(`   ${sourceName}: ${count} (${sourcePercent}%)`);
      }
    }
    
    // Warnings and recommendations
    console.log('\n⚠️  Build Warnings and Recommendations:');
    
    if (overallStats.productsWithoutImages > 0) {
      console.log(`   • ${overallStats.productsWithoutImages} products are missing images`);
      console.log('   • Run "node scripts/add-images-with-tracking.mjs" to automatically add images');
      console.log('   • Consider manual review for products that failed automatic image fetching');
    }
    
    if (overallStats.problemFiles.length > 0) {
      console.log(`   • ${overallStats.problemFiles.length} files had processing errors`);
      console.log(`   • Problem files: ${overallStats.problemFiles.join(', ')}`);
    }
    
    // Check for low-quality sources
    const lowQualitySources = ['none', 'error', 'unknown'];
    const lowQualityCount = lowQualitySources.reduce((sum, source) => 
      sum + (overallStats.sourceBreakdown[source] || 0), 0);
    
    if (lowQualityCount > 0) {
      console.log(`   • ${lowQualityCount} products have low-quality or missing image sources`);
      console.log('   • Consider running enhanced image fetching for better coverage');
    }
    
    // Exit code for CI/CD integration
    if (overallStats.productsWithoutImages > 0 || overallStats.problemFiles.length > 0) {
      console.log('\n❌ Build validation found issues (see warnings above)');
      
      // For CI/CD: You can uncomment the next line to fail the build on missing images
      // process.exit(1);
    } else {
      console.log('\n✅ All tierlist files have complete image coverage!');
    }
    
  } catch (error) {
    console.error('Failed to validate tierlist files:', error.message);
    process.exit(1);
  }
}

// Run validation immediately
validateAllTierlists().catch(console.error);
