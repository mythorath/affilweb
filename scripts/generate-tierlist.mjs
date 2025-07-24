#!/usr/bin/env node

/**
 * Auto-generate tierlist content using SerpAPI and OpenAI
 * This script finds trending products, researches them, and creates complete MDX tierlists
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import OpenAI from 'openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  serpApiKey: process.env.SERPAPI_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  amazonTag: process.env.AMAZON_ASSOCIATE_TAG || 'mythorath-20',
  outputDir: path.join(__dirname, '..', 'src', 'content', 'tierlists'),
  maxProducts: 8, // Maximum products to research per category
  trendingCategories: [
    'best gaming headsets 2025',
    'best wireless keyboards 2025',
    'best standing desks 2025',
    'best webcams 2025',
    'best monitors 2025',
    'best speakers 2025',
    'best tablets 2025',
    'best smartwatches 2025',
    'best coffee makers 2025',
    'best air fryers 2025'
  ]
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: CONFIG.openaiApiKey,
});

/**
 * Step 1: Find trending product categories using SerpAPI
 */
async function findTrendingCategories() {
  console.log('🔍 Step 1: Finding trending product categories...');
  
  try {
    // For now, we'll use our predefined trending categories
    // In production, this could query Google Trends API or Reddit
    const selectedCategory = CONFIG.trendingCategories[
      Math.floor(Math.random() * CONFIG.trendingCategories.length)
    ];
    
    console.log(`✅ Selected category: "${selectedCategory}"`);
    return selectedCategory;
    
  } catch (error) {
    console.error('❌ Error finding trending categories:', error.message);
    throw error;
  }
}

/**
 * Step 2: Find top products in the selected category using SerpAPI
 */
async function findTopProducts(category) {
  console.log(`🛍️  Step 2: Finding top products for "${category}"...`);
  
  try {
    const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(category)}&api_key=${CONFIG.serpApiKey}`;
    
    const response = await fetch(searchUrl);
    const data = await response.json();
    
    // Extract product names from search results
    const products = [];
    
    // Look for product names in organic results
    if (data.organic_results) {
      for (const result of data.organic_results.slice(0, 10)) {
        const title = result.title;
        const snippet = result.snippet;
        
        // Extract product names from titles and snippets
        const extractedProducts = extractProductNames(title + ' ' + snippet, category);
        products.push(...extractedProducts);
        
        if (products.length >= CONFIG.maxProducts) break;
      }
    }
    
    // Remove duplicates and limit results
    const uniqueProducts = [...new Set(products)].slice(0, CONFIG.maxProducts);
    
    console.log(`✅ Found ${uniqueProducts.length} products:`, uniqueProducts);
    return uniqueProducts;
    
  } catch (error) {
    console.error('❌ Error finding products:', error.message);
    throw error;
  }
}

/**
 * Extract product names from text using pattern matching
 */
function extractProductNames(text, category) {
  const products = [];
  
  // Common product name patterns
  const patterns = [
    /\b([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z0-9][a-z0-9]*)*)\b/g, // Brand Model patterns
    /\b([A-Z][a-z]+\s+[A-Z0-9]+[a-z0-9]*)\b/g, // Brand + alphanumeric model
  ];
  
  patterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        // Filter out common words and keep product-like names
        if (match.length > 5 && match.length < 50 && 
            !match.toLowerCase().includes('best') &&
            !match.toLowerCase().includes('review') &&
            !match.toLowerCase().includes('guide')) {
          products.push(match.trim());
        }
      });
    }
  });
  
  return products;
}

/**
 * Step 3: Research each product for specs and reviews
 */
async function researchProducts(products, category) {
  console.log(`📚 Step 3: Researching ${products.length} products...`);
  
  const researchedProducts = [];
  
  for (const product of products) {
    try {
      console.log(`   Researching: ${product}`);
      
      // Search for product details using SerpAPI
      const searchQuery = `${product} specifications review 2025`;
      const searchUrl = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${CONFIG.serpApiKey}`;
      
      const response = await fetch(searchUrl);
      const data = await response.json();
      
      let productInfo = {
        name: product,
        specs: '',
        reviews: '',
        image: '',
        amazonUrl: ''
      };
      
      // Extract information from search results
      if (data.organic_results && data.organic_results.length > 0) {
        const topResults = data.organic_results.slice(0, 3);
        
        productInfo.specs = topResults
          .map(result => result.snippet)
          .join(' ')
          .substring(0, 500);
        
        productInfo.reviews = topResults
          .map(result => result.title + ' ' + result.snippet)
          .join(' ')
          .substring(0, 800);
      }
      
      // Look for Amazon URL and image
      if (data.shopping_results && data.shopping_results.length > 0) {
        const shoppingResult = data.shopping_results[0];
        productInfo.image = shoppingResult.thumbnail || '';
        productInfo.amazonUrl = shoppingResult.link || '';
      }
      
      researchedProducts.push(productInfo);
      
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error researching ${product}:`, error.message);
      // Continue with next product
    }
  }
  
  console.log(`✅ Successfully researched ${researchedProducts.length} products`);
  return researchedProducts;
}

/**
 * Step 4: Use OpenAI to rank products and generate tierlist content
 */
async function generateTierlistContent(products, category) {
  console.log('🤖 Step 4: Generating tierlist content with OpenAI...');
  
  try {
    const prompt = `You are an expert product reviewer creating a comprehensive tier list for "${category}".

Here are the products to rank and review:

${products.map((p, i) => `${i + 1}. ${p.name}
Specs: ${p.specs}
Reviews: ${p.reviews}
`).join('\n')}

Please create a tier list ranking these products into S, A, and B tiers based on:
- Performance and quality
- Value for money
- User satisfaction
- Build quality and features

For each product, write a concise 1-2 sentence review explaining why it's in that tier.

Also generate:
1. A catchy title for this tier list
2. A compelling 2-sentence description for SEO
3. A 3-4 sentence introduction paragraph
4. A brief summary paragraph
5. Relevant tags (5-7 tags)

Format your response as JSON:
{
  "title": "...",
  "description": "...",
  "introduction": "...",
  "summary": "...",
  "tags": ["tag1", "tag2", ...],
  "tiers": {
    "S": [{"name": "Product Name", "review": "Review text"}],
    "A": [{"name": "Product Name", "review": "Review text"}],
    "B": [{"name": "Product Name", "review": "Review text"}]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert product reviewer who creates detailed, honest tier lists. Always provide balanced, informative reviews."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = JSON.parse(completion.choices[0].message.content);
    console.log(`✅ Generated content for: ${content.title}`);
    
    return content;
    
  } catch (error) {
    console.error('❌ Error generating content:', error.message);
    throw error;
  }
}

/**
 * Step 5: Create Amazon affiliate links
 */
function createAffiliateLink(productName) {
  // Create a simple Amazon search link with affiliate tag
  const searchQuery = productName.replace(/\s+/g, '+');
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${CONFIG.amazonTag}`;
}

/**
 * Step 6: Generate MDX file content
 */
function generateMDXContent(content, products) {
  console.log('📝 Step 5: Generating MDX file content...');
  
  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Map generated tiers to products with additional data
  const enrichedTiers = {};
  
  Object.keys(content.tiers).forEach(tier => {
    let tierLabel;
    if (tier === 'S') {
      tierLabel = 'Top Picks';
    } else if (tier === 'A') {
      tierLabel = 'Great Options';
    } else {
      tierLabel = 'Budget Choices';
    }
    
    enrichedTiers[tier] = {
      label: tierLabel,
      products: content.tiers[tier].map(product => {
        const originalProduct = products.find(p => 
          p.name.toLowerCase().includes(product.name.toLowerCase()) ||
          product.name.toLowerCase().includes(p.name.toLowerCase())
        );
        
        return {
          name: product.name,
          image: originalProduct?.image || `https://via.placeholder.com/300x200?text=${encodeURIComponent(product.name)}`,
          link: originalProduct?.amazonUrl || createAffiliateLink(product.name),
          review: product.review
        };
      })
    };
  });
  
  const mdxContent = `---
title: "${content.title}"
description: "${content.description}"
slug: "${slug}"
pubDate: ${currentDate}
tags: ${JSON.stringify(content.tags)}
image: "/images/${slug}-hero.webp"
---

import TierList from '../../components/TierList.astro'

# ${content.title}

${content.introduction}

<TierList
  category="${content.tags[0] || 'products'}"
  tiers={${JSON.stringify(enrichedTiers, null, 4)}}
/>

## 🎯 What We Looked For

- Performance and reliability
- Value for money
- User reviews and satisfaction
- Build quality and features
- Long-term durability

## 📦 Summary

${content.summary}

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "ItemList",
  "name": "${content.title}",
  "itemListElement": [
    ${Object.values(content.tiers).flat().map((product, index) => 
      `{ "@type": "Product", "name": "${product.name}", "position": ${index + 1} }`
    ).join(',\n    ')}
  ]
}
</script>`;

  return { mdxContent, slug };
}

/**
 * Step 7: Save MDX file
 */
async function saveMDXFile(mdxContent, slug) {
  console.log('💾 Step 6: Saving MDX file...');
  
  try {
    // Ensure output directory exists
    await fs.mkdir(CONFIG.outputDir, { recursive: true });
    
    const filename = `${slug}.mdx`;
    const filepath = path.join(CONFIG.outputDir, filename);
    
    await fs.writeFile(filepath, mdxContent, 'utf-8');
    
    console.log(`✅ Saved tierlist to: ${filepath}`);
    return filepath;
    
  } catch (error) {
    console.error('❌ Error saving file:', error.message);
    throw error;
  }
}

/**
 * Main execution function
 */
async function generateTierlist() {
  console.log('🚀 Starting automated tierlist generation...\n');
  
  try {
    // Validate environment variables
    if (!CONFIG.serpApiKey) {
      throw new Error('SERPAPI_KEY environment variable is required');
    }
    if (!CONFIG.openaiApiKey) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    // Step 1: Find trending category
    const category = await findTrendingCategories();
    
    // Step 2: Find top products
    const productNames = await findTopProducts(category);
    
    if (productNames.length === 0) {
      throw new Error('No products found for category');
    }
    
    // Step 3: Research products
    const researchedProducts = await researchProducts(productNames, category);
    
    if (researchedProducts.length === 0) {
      throw new Error('No products could be researched');
    }
    
    // Step 4: Generate content with OpenAI
    const content = await generateTierlistContent(researchedProducts, category);
    
    // Step 5: Generate MDX file
    const { mdxContent, slug } = generateMDXContent(content, researchedProducts);
    
    // Step 6: Save file
    const filepath = await saveMDXFile(mdxContent, slug);
    
    console.log('\n🎉 Tierlist generation complete!');
    console.log(`📄 File: ${filepath}`);
    console.log(`🔗 URL: http://localhost:4321/${slug}`);
    console.log(`📊 Products: ${researchedProducts.length}`);
    console.log(`🏷️  Category: ${category}`);
    
    return {
      filepath,
      slug,
      category,
      productCount: researchedProducts.length
    };
    
  } catch (error) {
    console.error('\n❌ Tierlist generation failed:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  generateTierlist();
}

export default generateTierlist;
