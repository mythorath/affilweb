#!/usr/bin/env node
/**
 * Tierlist Review Auto-Enhancer with OpenAI
 * 
 * This script automatically enhances tierlist MDX files by generating high-quality
 * product reviews using OpenAI's API. It processes existing tierlist files and adds
 * detailed, informative reviews for products that are missing reviews or have placeholders.
 */

import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates a high-quality product review using OpenAI
 * @param {string} productName - Name of the product to review
 * @param {string} tierLevel - Tier level (S, A, B, C, etc.) for context
 * @param {string} category - Product category (gaming headsets, laptops, etc.)
 * @returns {Promise<string|null>} Generated review or null if failed
 */
async function generateReviewWithLLM(productName, tierLevel = 'A', category = 'product') {
  console.log(`🤖 Generating review for: "${productName}" (Tier ${tierLevel})`);
  
  try {
    const prompt = `Write a concise, informative product review for the ${productName} in the ${category} category. 

Requirements:
- 1-2 sentences maximum (20-40 words)
- Focus on key strengths and use cases
- Professional, helpful tone
- No marketing fluff or excessive adjectives
- Tier ${tierLevel} quality level context (S=exceptional, A=great, B=good, C=basic)
- Include specific technical benefits or standout features

Example format: "Excellent build quality with premium materials. Perfect for professional use with outstanding battery life and wireless connectivity."

Product: ${productName}
Review:`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use the efficient model for reviews
      messages: [
        {
          role: 'system',
          content: 'You are a professional product reviewer who writes concise, informative reviews focusing on key features and use cases. Keep reviews between 20-40 words.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 100,
      temperature: 0.7,
    });

    const review = response.choices[0]?.message?.content?.trim();
    
    if (review && review.length > 10) {
      console.log(`✅ Generated review: "${review.substring(0, 60)}..."`);
      return review;
    } else {
      console.warn(`❌ Invalid review generated for ${productName}`);
      return null;
    }
    
  } catch (error) {
    console.error(`❌ Error generating review for ${productName}:`, error.message);
    return null;
  }
}

/**
 * Checks if a review needs enhancement (missing, too short, or placeholder)
 * @param {string} review - Current review text
 * @returns {boolean} True if review needs enhancement
 */
function needsReviewEnhancement(review) {
  if (!review || review.trim() === '') {
    return true; // Missing review
  }
  
  const cleanReview = review.trim().toLowerCase();
  
  // Check for placeholder text
  const placeholders = [
    'placeholder',
    'todo',
    'tbd',
    'coming soon',
    'review pending',
    'great product',
    'excellent choice',
    'good option',
    'solid pick',
    'recommended'
  ];
  
  if (placeholders.some(placeholder => cleanReview.includes(placeholder))) {
    return true; // Contains placeholder text
  }
  
  // Check if review is too short (less than 15 words or 80 characters)
  const wordCount = cleanReview.split(/\s+/).length;
  if (wordCount < 15 || cleanReview.length < 80) {
    return true; // Too short
  }
  
  return false; // Review is probably good
}

/**
 * Extracts category from tierlist title or file path
 * @param {string} title - Tierlist title
 * @param {string} filePath - File path
 * @returns {string} Product category
 */
function extractCategory(title, filePath) {
  const titleLower = title.toLowerCase();
  const pathLower = filePath.toLowerCase();
  
  const categories = {
    'headset': 'gaming headsets',
    'headphone': 'headphones',
    'mouse': 'gaming mice',
    'mice': 'gaming mice',
    'keyboard': 'gaming keyboards',
    'laptop': 'laptops',
    'chair': 'office chairs',
    'monitor': 'monitors',
    'earbuds': 'wireless earbuds',
    'speaker': 'speakers',
    'webcam': 'webcams',
    'microphone': 'microphones'
  };
  
  for (const [key, category] of Object.entries(categories)) {
    if (titleLower.includes(key) || pathLower.includes(key)) {
      return category;
    }
  }
  
  return 'products'; // Default category
}

/**
 * Enhances a tierlist file with AI-generated product reviews
 * @param {string} filePath - Path to the tierlist MDX file
 * @returns {Promise<boolean>} True if file was enhanced, false if no changes needed
 */
export async function enhanceTierlistWithReviews(filePath) {
  console.log(`🔍 Enhancing tierlist reviews: ${path.basename(filePath)}`);
  
  try {
    // Read the MDX file
    const content = await fs.readFile(filePath, 'utf8');
    
    // Extract title from frontmatter
    const titleMatch = content.match(/^title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1] : '';
    const category = extractCategory(title, filePath);
    
    console.log(`📂 Category detected: ${category}`);
    
    // Extract the TierList component content
    const tierListMatch = content.match(/<TierList\s+tiers=\{\{([\s\S]*?)\}\}\s*\/>/);
    
    if (!tierListMatch) {
      console.log(`⚠️  No TierList component found in ${path.basename(filePath)}`);
      return false;
    }
    
    // Parse the tiers object
    const tiersContent = tierListMatch[1];
    let tiersData;
    
    try {
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
        
        // Check if review needs enhancement
        if (needsReviewEnhancement(product.review)) {
          console.log(`🔍 Enhancing review for: "${product.name}"`);
          
          try {
            const newReview = await generateReviewWithLLM(product.name, tierName, category);
            
            if (newReview) {
              enhancedProduct.review = newReview;
              hasChanges = true;
              
              console.log(`✅ Enhanced review for "${product.name}"`);
            } else {
              console.log(`❌ Failed to generate review for "${product.name}"`);
              // Keep existing review (even if placeholder)
            }
          } catch (error) {
            console.error(`❌ Error enhancing review for "${product.name}":`, error.message);
            // Keep existing review
          }
          
          // Add delay to respect API limits
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.log(`✅ Review already good for "${product.name}"`);
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
      
      console.log(`✅ Enhanced ${path.basename(filePath)} with new reviews`);
      return true;
    } else {
      console.log(`✅ No review enhancement needed for ${path.basename(filePath)} - all reviews are good`);
      return false;
    }
    
  } catch (error) {
    console.error(`❌ Error enhancing reviews in ${path.basename(filePath)}:`, error.message);
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
      
      if (product.review) props.push(`review: "${product.review.replace(/"/g, '\\\\"')}"`);
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
 * Enhances all tierlist files with AI-generated reviews
 * @param {string} contentDir - Path to the tierlists content directory
 * @returns {Promise<void>}
 */
export async function enhanceAllTierlistsWithReviews(contentDir = 'src/content/tierlists') {
  console.log('🚀 Starting tierlist review auto-enhancement with OpenAI...\n');
  
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
      const wasEnhanced = await enhanceTierlistWithReviews(filePath);
      
      if (wasEnhanced) {
        enhancedCount++;
      }
      
      console.log(''); // Empty line for readability
    }
    
    console.log(`🎉 Review enhancement complete!`);
    console.log(`📊 Enhanced ${enhancedCount} out of ${mdxFiles.length} tierlist files`);
    
    if (enhancedCount > 0) {
      console.log('\n💡 Tip: Review the enhanced files and commit the changes to save the new reviews');
    }
    
  } catch (error) {
    console.error('❌ Error during review enhancement:', error.message);
  }
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    // Enhance specific file
    const filePath = args[0];
    enhanceTierlistWithReviews(filePath)
      .then(wasEnhanced => {
        if (wasEnhanced) {
          console.log(`✅ Successfully enhanced reviews in ${path.basename(filePath)}`);
        } else {
          console.log(`ℹ️  No review changes needed for ${path.basename(filePath)}`);
        }
      })
      .catch(console.error);
  } else {
    // Enhance all files
    enhanceAllTierlistsWithReviews().catch(console.error);
  }
}
