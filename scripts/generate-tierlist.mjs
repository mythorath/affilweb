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
    const prompt = `You are an expert product reviewer creating a comprehensive tier list for "${category}". Write in an engaging, authoritative tone that builds trust with readers.

Here are the products to rank and review:

${products.map((p, i) => `${i + 1}. ${p.name}
Specs: ${p.specs}
Reviews: ${p.reviews}
`).join('\n')}

Create a tier list ranking these products into S, A, and B tiers based on:
- Performance and quality
- Value for money 
- User satisfaction
- Build quality and features
- Category-specific criteria

For each product, write a detailed 2-3 sentence review that:
- Explains specific strengths and features
- Justifies the tier placement
- Uses technical details and user benefits
- Maintains an expert, trustworthy tone

Also generate:
1. A compelling, SEO-optimized title (include year 2025)
2. A 2-sentence meta description for search engines
3. A 3-4 sentence introduction that hooks readers and establishes expertise
4. A comprehensive 3-4 sentence summary that wraps up the guide
5. 6-8 relevant SEO tags including the main category

Make the content authoritative yet accessible. Focus on helping readers make informed purchasing decisions.

Format your response as JSON:
{
  "title": "Best [Category] 2025 - Expert Tier List & Buying Guide",
  "description": "Two sentence SEO description under 160 characters...",
  "introduction": "Multi-sentence introduction that establishes authority and hooks the reader...",
  "summary": "Comprehensive summary that reinforces the value and guides next steps...",
  "tags": ["primary-category", "secondary-category", "year", "guide-type", "audience", "feature"],
  "tiers": {
    "S": [{"name": "Exact Product Name", "review": "Detailed 2-3 sentence review with specific features and benefits"}],
    "A": [{"name": "Exact Product Name", "review": "Detailed 2-3 sentence review with specific features and benefits"}],
    "B": [{"name": "Exact Product Name", "review": "Detailed 2-3 sentence review with specific features and benefits"}]
  }
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system", 
          content: "You are an expert product reviewer who creates detailed, trustworthy tier lists. Write comprehensive reviews that help readers make informed purchasing decisions. Use specific technical details and real-world benefits. Maintain an authoritative yet approachable tone throughout."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 3000
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
 * Step 5: Create Amazon affiliate links with proper ASIN format
 */
function createAffiliateLink(productName, amazonUrl = null) {
  if (amazonUrl) {
    // Extract ASIN from existing Amazon URL if available
    const asinMatch = amazonUrl.match(/\/dp\/([A-Z0-9]{10})/);
    if (asinMatch) {
      return `https://www.amazon.com/dp/${asinMatch[1]}?tag=${CONFIG.amazonTag}`;
    }
  }
  
  // Fallback to Amazon search with affiliate tag
  const searchQuery = productName.replace(/\s+/g, '+');
  return `https://www.amazon.com/s?k=${searchQuery}&tag=${CONFIG.amazonTag}`;
}

/**
 * Step 6: Generate MDX file content using pagetemplate.md format
 */
function generateMDXContent(content, products) {
  console.log('📝 Step 5: Generating MDX file content...');
  
  const slug = content.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Get the hero image from the first S-tier product or use CDN placeholder
  const heroProduct = content.tiers.S?.[0]?.name || content.tiers.A?.[0]?.name || 'hero';
  const heroSlug = heroProduct.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-');
  const heroImage = `https://cdn.trendtiers.com/images/${heroSlug}.jpg`;
  
  // Generate tier arrays in the template format
  const generateTierArray = (tierProducts) => {
    return tierProducts.map(product => {
      const originalProduct = products.find(p => 
        p.name.toLowerCase().includes(product.name.toLowerCase()) ||
        product.name.toLowerCase().includes(p.name.toLowerCase())
      );
      
      // Use CDN-style image naming convention
      const imageSlug = product.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-');
      
      return {
        name: product.name,
        review: product.review,
        link: originalProduct?.amazonUrl || createAffiliateLink(product.name, originalProduct?.amazonUrl),
        image: originalProduct?.image || `https://cdn.trendtiers.com/images/${imageSlug}.jpg`
      };
    });
  };
  
  // Generate category-specific criteria
  const categoryKeywords = content.tags.join(' ').toLowerCase();
  let criteriaSection = '';
  
  if (categoryKeywords.includes('gaming')) {
    criteriaSection = `- **Performance**: Low latency and high-quality audio
- **Comfort**: Extended gaming session comfort
- **Build Quality**: Durable construction for daily use
- **Features**: Mic quality and gaming-specific features
- **Value**: Price-to-performance ratio`;
  } else if (categoryKeywords.includes('fitness') || categoryKeywords.includes('workout')) {
    criteriaSection = `- **Fit & Comfort**: Ear hooks, wing tips, or customizable eartips
- **Sweat & Water Resistance**: Minimum IPX5 recommended
- **Battery Life**: 6+ hours on a single charge
- **Sound Quality**: Bass-forward tuning helps during intense exercise
- **Durability**: Drop and water resistance for gym bags and running`;
  } else if (categoryKeywords.includes('wireless') || categoryKeywords.includes('headphones')) {
    criteriaSection = `- **Sound Quality**: Balanced audio with clear highs and deep bass
- **Battery Life**: All-day usage without frequent charging
- **Comfort**: Lightweight design for extended wear
- **Connectivity**: Stable Bluetooth connection
- **Features**: Noise cancellation and smart controls`;
  } else {
    criteriaSection = `- **Performance**: Overall quality and reliability
- **Value for Money**: Best bang for your buck
- **User Reviews**: Real-world satisfaction ratings
- **Build Quality**: Construction and materials
- **Features**: Useful functionality and innovation`;
  }
  
  const mdxContent = `---
title: "${content.title}"
description: "${content.description}"
pubDate: ${currentDate}
slug: "${slug}"
tags: ${JSON.stringify(content.tags)}
image: "${heroImage}"
---

import TierList from "@/components/TierList"

# ${content.title}

${content.introduction}

---

## 🧪 What We Looked For

${criteriaSection}

---

## 📦 Summary

${content.summary}

---

<TierList 
  s={${JSON.stringify(generateTierArray(content.tiers.S || []), null, 4).replace(/^/gm, '    ')}}
  a={${JSON.stringify(generateTierArray(content.tiers.A || []), null, 4).replace(/^/gm, '    ')}}
  b={${JSON.stringify(generateTierArray(content.tiers.B || []), null, 4).replace(/^/gm, '    ')}}
/>

---

*Affiliate Disclosure: This post contains affiliate links. We may earn a commission if you make a purchase through these links at no additional cost to you.*`;

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
