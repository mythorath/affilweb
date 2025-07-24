#!/usr/bin/env node

import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';

// Load environment variables
dotenv.config();

console.log('🚀 Starting review generation script...');
console.log('📁 Current directory:', process.cwd());
console.log('🔑 API Key present:', !!process.env.OPENAI_API_KEY);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates detailed markdown review paragraphs for a list of products
 * @param {Array} products - Array of product objects
 * @param {Object} options - Configuration options
 * @returns {Promise<Array>} Array of products with generated reviews
 */
export async function generateProductReviews(products, options = {}) {
  const {
    wordCount = '150-300',
    category = 'general products',
    tone = 'professional and helpful',
    includeAffiliate = true,
    batchSize = 3
  } = options;

  console.log(`🔄 Generating reviews for ${products.length} products...`);
  
  const results = [];
  
  // Process products in batches to avoid rate limits
  for (let i = 0; i < products.length; i += batchSize) {
    const batch = products.slice(i, i + batchSize);
    console.log(`📝 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)}...`);
    
    const batchPromises = batch.map(product => generateSingleReview(product, {
      wordCount,
      category,
      tone,
      includeAffiliate
    }));
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Add delay between batches to respect rate limits
    if (i + batchSize < products.length) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Generates a detailed review for a single product
 * @param {Object} product - Product object with name, description, features, etc.
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Product with generated review
 */
async function generateSingleReview(product, options) {
  const { wordCount, category, tone, includeAffiliate } = options;
  
  try {
    console.log(`🔍 Generating review for: ${product.name}`);
    const prompt = createReviewPrompt(product, { wordCount, category, tone, includeAffiliate });
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an expert product reviewer who writes detailed, helpful, and engaging product reviews. Your reviews are informative, balanced, and include specific use cases and benefits."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    const review = completion.choices[0].message.content.trim();
    
    console.log(`✅ Generated review for: ${product.name}`);
    
    return {
      ...product,
      review: review,
      generatedAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error(`❌ Error generating review for ${product.name}:`, error.message);
    return {
      ...product,
      review: `Unable to generate review at this time. Please check back later.`,
      error: error.message,
      generatedAt: new Date().toISOString()
    };
  }
}

/**
 * Creates a detailed prompt for review generation
 */
function createReviewPrompt(product, options) {
  const { wordCount, category, tone, includeAffiliate } = options;
  
  const affiliateSection = includeAffiliate 
    ? "\n- End with a soft call-to-action that encourages readers to check current pricing or availability"
    : "";
  
  return `Write a detailed product review for the following ${category} item:

**Product Name:** ${product.name}
**Price:** ${product.price || 'Not specified'}
**Description:** ${product.description || 'No description provided'}
**Key Features:** ${Array.isArray(product.features) ? product.features.join(', ') : (product.features || 'Not specified')}
**Brand:** ${product.brand || 'Not specified'}

Requirements:
- Write ${wordCount} words
- Use a ${tone} tone
- Focus on specific strengths and practical use cases
- Include who this product is best suited for
- Mention any standout features or benefits
- Be honest and balanced (mention any considerations if relevant)
- Use markdown formatting for emphasis where appropriate${affiliateSection}
- Do not include a title or heading, just the review paragraph(s)

Write an engaging, informative review that helps readers understand if this product is right for them.`;
}

/**
 * CLI function to generate reviews from a JSON file
 */
async function generateReviewsFromFile(inputFile, outputFile = null) {
  try {
    console.log(`📖 Reading input file: ${inputFile}`);
    
    // Read input file
    const inputPath = path.resolve(inputFile);
    const fileContent = await fs.readFile(inputPath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    // Extract products array
    const products = Array.isArray(data) ? data : data.products || [];
    console.log(`📋 Found ${products.length} products to process`);
    
    if (products.length === 0) {
      throw new Error('No products found in input file. Expected an array of products or an object with a "products" property.');
    }
    
    console.log(`🎯 Processing ${products.length} products`);
    
    // Validate product structure
    for (const product of products) {
      if (!product.name) {
        console.warn(`⚠️  Product missing name:`, product);
      }
    }
    
    // Generate reviews
    const reviewOptions = data.options || {};
    console.log(`⚙️  Using options:`, reviewOptions);
    const productsWithReviews = await generateProductReviews(products, reviewOptions);
    
    // Prepare output
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        totalProducts: productsWithReviews.length,
        options: reviewOptions
      },
      products: productsWithReviews
    };
    
    // Write output file
    if (outputFile) {
      const outputPath = path.resolve(outputFile);
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`💾 Reviews saved to: ${outputPath}`);
    } else {
      // Generate output filename based on input
      const inputBasename = path.basename(inputFile, path.extname(inputFile));
      const outputPath = path.resolve(`${inputBasename}-reviews.json`);
      await fs.writeFile(outputPath, JSON.stringify(output, null, 2), 'utf-8');
      console.log(`💾 Reviews saved to: ${outputPath}`);
    }
    
    console.log(`🎉 Successfully generated ${productsWithReviews.length} product reviews!`);
    return productsWithReviews;
    
  } catch (error) {
    console.error('❌ Error generating reviews:', error.message);
    console.error('📍 Stack trace:', error.stack);
    process.exit(1);
  }
}

// CLI usage
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  console.log('🎯 CLI mode detected');
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: node generateReviews.mjs <input-file.json> [output-file.json]

Example: node generateReviews.mjs products.json reviews.json

Input file should contain:
{
  "products": [
    {
      "name": "Product Name",
      "price": "$99.99",
      "description": "Product description",
      "features": ["feature1", "feature2"],
      "brand": "Brand Name"
    }
  ],
  "options": {
    "category": "office chairs",
    "wordCount": "200-300",
    "tone": "professional and enthusiastic"
  }
}
`);
    process.exit(1);
  }
  
  const [inputFile, outputFile] = args;
  console.log(`📂 Input file: ${inputFile}`);
  console.log(`📂 Output file: ${outputFile || 'auto-generated'}`);
  
  generateReviewsFromFile(inputFile, outputFile);
} else {
  console.log('📦 Module mode detected');
}

export default generateProductReviews;
