#!/usr/bin/env node

/**
 * TrendTiers.com - Affiliate Link Enhancement Script
 * 
 * Ensures each product in tierlist MDX files has a valid Amazon affiliate link
 * with the correct tracking ID. Preserves existing valid links and MDX formatting.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const AMAZON_ASSOCIATE_TAG = process.env.AMAZON_ASSOCIATE_TAG || 'mythorath-20';
const TIERLISTS_DIR = path.join(__dirname, '..', 'src', 'content', 'tierlists');

/**
 * Generate Amazon search URL with affiliate tracking
 * @param {string} productName - The product name to search for
 * @returns {string} Amazon search URL with affiliate tag
 */
function generateAmazonSearchURL(productName) {
  const cleanedName = productName
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens
    .replace(/\s+/g, '+')     // Replace spaces with plus signs
    .trim();
  
  return `https://www.amazon.com/s?k=${encodeURIComponent(cleanedName)}&tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Check if a link is a valid Amazon URL with correct affiliate tag
 * @param {string} link - The link to validate
 * @returns {boolean} True if valid Amazon affiliate link
 */
function isValidAmazonAffiliateLink(link) {
  if (!link || typeof link !== 'string') return false;
  
  const amazonDomains = ['amazon.com', 'amzn.to', 'a.co'];
  const hasAmazonDomain = amazonDomains.some(domain => link.includes(domain));
  
  if (!hasAmazonDomain) return false;
  
  // Check if it has the correct affiliate tag
  return link.includes(`tag=${AMAZON_ASSOCIATE_TAG}`) || link.includes(`&tag=${AMAZON_ASSOCIATE_TAG}`);
}

/**
 * Add affiliate tag to existing Amazon URL
 * @param {string} link - Existing Amazon link
 * @returns {string} Updated link with affiliate tag
 */
function addAffiliateTagToAmazonLink(link) {
  if (!link || typeof link !== 'string') return link;
  
  const amazonDomains = ['amazon.com', 'amzn.to', 'a.co'];
  const hasAmazonDomain = amazonDomains.some(domain => link.includes(domain));
  
  if (!hasAmazonDomain) return link;
  
  // If it already has the correct tag, return as-is
  if (link.includes(`tag=${AMAZON_ASSOCIATE_TAG}`)) return link;
  
  // Remove any existing tag parameter
  let cleanLink = link.replace(/[&?]tag=[^&]*/, '');
  
  // Add our affiliate tag
  const separator = cleanLink.includes('?') ? '&' : '?';
  return `${cleanLink}${separator}tag=${AMAZON_ASSOCIATE_TAG}`;
}

/**
 * Process a single product object to ensure it has a valid affiliate link
 * @param {Object} product - Product object from tierlist
 * @returns {Object} Updated product object
 */
function enhanceProductAffiliateLink(product) {
  if (!product || typeof product !== 'object') return product;
  
  const { name, link } = product;
  
  // If link is already valid, keep it
  if (isValidAmazonAffiliateLink(link)) {
    return product;
  }
  
  // If it's an Amazon link but missing/wrong tag, fix it
  if (link && (link.includes('amazon.com') || link.includes('amzn.to') || link.includes('a.co'))) {
    return {
      ...product,
      link: addAffiliateTagToAmazonLink(link)
    };
  }
  
  // If no link or non-Amazon link, generate Amazon search URL
  if (name) {
    return {
      ...product,
      link: generateAmazonSearchURL(name)
    };
  }
  
  return product;
}

/**
 * Parse the MDX content and extract the TierList component data
 * @param {string} content - MDX file content
 * @returns {Object} Parsed data with tiers and metadata
 */
function parseMDXContent(content) {
  try {
    // Extract the TierList component props using regex
    const tierListMatch = content.match(/<TierList\s+tiers=\{(\{[\s\S]*?\})\}\s*\/>/);
    
    if (!tierListMatch) {
      console.warn('No TierList component found in MDX');
      return { tiers: {}, originalContent: content };
    }
    
    const tiersString = tierListMatch[1];
    
    // Use a more robust parsing approach
    // Replace the tiers object with a placeholder for reconstruction
    const beforeTiers = content.substring(0, tierListMatch.index);
    const afterTiers = content.substring(tierListMatch.index + tierListMatch[0].length);
    
    // Parse the tiers object using a safer approach
    // First, quote unquoted property names for JSON compatibility
    let cleanedTiersString = tiersString
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/(\w+):\s*([^,}\]]+)/g, (match, key, value) => {
        // Quote unquoted keys and handle values properly
        const quotedKey = key.startsWith('"') ? key : `"${key}"`;
        
        // If value is a string literal (not quoted), quote it
        if (!value.startsWith('"') && !value.startsWith('[') && !value.startsWith('{') && isNaN(value) && value !== 'true' && value !== 'false' && value !== 'null') {
          return `${quotedKey}: "${value.trim()}"`;
        }
        return `${quotedKey}: ${value}`;
      });
    
    // Try parsing with JSON.parse
    let tiers;
    try {
      tiers = JSON.parse(cleanedTiersString);
    } catch (jsonError) {
      // If JSON parsing fails, try using eval as a fallback (less safe but works with JS object syntax)
      console.warn('JSON parsing failed:', jsonError.message, 'using eval fallback');
      tiers = eval(`(${tiersString})`);
    }
    
    return {
      tiers,
      beforeTiers,
      afterTiers,
      originalContent: content
    };
  } catch (error) {
    console.error('Error parsing MDX content:', error.message);
    
    // Try a simpler regex-based approach for basic cases
    try {
      console.log('Attempting regex-based parsing...');
      const tierEntries = content.match(/"[SABCDEF]":\s*\[[^\]]*\]/g);
      if (tierEntries) {
        const tiers = {};
        tierEntries.forEach(entry => {
          const tierMatch = entry.match(/"([SABCDEF])":\s*(\[[^\]]*\])/);
          if (tierMatch) {
            const tierName = tierMatch[1];
            const products = eval(tierMatch[2]); // Parse the array
            tiers[tierName] = products;
          }
        });
        
        return {
          tiers,
          beforeTiers: content.split('<TierList')[0] + '<TierList\n  tiers={',
          afterTiers: '}\n/>' + content.split('/>')[content.split('/>').length - 1],
          originalContent: content
        };
      }
    } catch (regexError) {
      console.error('Regex parsing also failed:', regexError.message);
    }
    
    console.error('All parsing methods failed. Problematic content:', content.substring(0, 500) + '...');
    return { tiers: {}, originalContent: content };
  }
}

/**
 * Reconstruct MDX content with enhanced affiliate links
 * @param {Object} parsedData - Parsed MDX data
 * @returns {string} Updated MDX content
 */
function reconstructMDXContent(parsedData) {
  const { tiers, beforeTiers, afterTiers, originalContent } = parsedData;
  
  if (!tiers || Object.keys(tiers).length === 0) {
    return originalContent;
  }
  
  // Convert tiers object back to string with proper formatting
  const tiersString = JSON.stringify(tiers, null, 4)
    .replace(/"/g, '"')
    .replace(/\n/g, '\n    '); // Add proper indentation
  
  // Reconstruct the TierList component
  const tierListComponent = `<TierList\n  tiers={${tiersString}}\n/>`;
  
  return beforeTiers + tierListComponent + afterTiers;
}

/**
 * Enhance a single tierlist MDX file with affiliate links
 * @param {string} filePath - Path to the MDX file
 * @returns {Promise<Object>} Enhancement results
 */
export async function enhanceTierlistWithAffiliateLinks(filePath) {
  try {
    console.log(`🔗 Processing: ${path.basename(filePath)}`);
    
    const content = await fs.readFile(filePath, 'utf-8');
    const parsedData = parseMDXContent(content);
    
    if (!parsedData.tiers || Object.keys(parsedData.tiers).length === 0) {
      console.log(`⚠️  No tiers found in ${path.basename(filePath)}`);
      return { success: false, message: 'No tiers found' };
    }
    
    let enhancementCount = 0;
    
    // Process each tier
    for (const [, products] of Object.entries(parsedData.tiers)) {
      if (Array.isArray(products)) {
        for (let i = 0; i < products.length; i++) {
          const originalLink = products[i].link;
          const enhancedProduct = enhanceProductAffiliateLink(products[i]);
          
          if (enhancedProduct.link !== originalLink) {
            enhancementCount++;
            console.log(`  ✅ Enhanced ${enhancedProduct.name}: ${enhancedProduct.link}`);
          }
          
          products[i] = enhancedProduct;
        }
      }
    }
    
    if (enhancementCount > 0) {
      const updatedContent = reconstructMDXContent(parsedData);
      await fs.writeFile(filePath, updatedContent, 'utf-8');
      console.log(`💾 Saved ${enhancementCount} affiliate link enhancements`);
    } else {
      console.log(`✅ All affiliate links already valid`);
    }
    
    return {
      success: true,
      enhancementCount,
      message: `Enhanced ${enhancementCount} affiliate links`
    };
    
  } catch (error) {
    console.error(`❌ Error processing ${path.basename(filePath)}:`, error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Main function to process all tierlist files
 */
async function main() {
  console.log('🚀 TrendTiers Affiliate Link Enhancement');
  console.log(`📁 Scanning: ${TIERLISTS_DIR}`);
  console.log(`🏷️  Affiliate Tag: ${AMAZON_ASSOCIATE_TAG}\n`);
  
  try {
    const files = await fs.readdir(TIERLISTS_DIR);
    console.log(`Found ${files.length} files`);
    
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    console.log(`Found ${mdxFiles.length} MDX files`);
    
    if (mdxFiles.length === 0) {
      console.log('No MDX files found in tierlists directory');
      return;
    }
    
    let totalEnhancements = 0;
    const results = [];
    
    for (const file of mdxFiles) {
      const filePath = path.join(TIERLISTS_DIR, file);
      const result = await enhanceTierlistWithAffiliateLinks(filePath);
      results.push({ file, ...result });
      
      if (result.success && result.enhancementCount > 0) {
        totalEnhancements += result.enhancementCount;
      }
      
      console.log(''); // Add spacing between files
    }
    
    // Summary
    console.log('📊 Enhancement Summary:');
    console.log(`   Files processed: ${mdxFiles.length}`);
    console.log(`   Total enhancements: ${totalEnhancements}`);
    console.log(`   Success rate: ${results.filter(r => r.success).length}/${results.length}\n`);
    
    // Show any errors
    const errors = results.filter(r => !r.success);
    if (errors.length > 0) {
      console.log('❌ Errors encountered:');
      errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url.includes('enhance-tierlists-with-affiliate-links.mjs')) {
  console.log('Script started directly...');
  main().catch(error => {
    console.error('Unhandled error:', error);
    process.exit(1);
  });
}
