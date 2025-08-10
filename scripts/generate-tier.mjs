import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate a slug from a topic string
 * @param {string} topic - The topic string (e.g., "best USB microphones 2025")
 * @returns {string} - Formatted slug (e.g., "best-usb-microphones-2025")
 */
function generateSlug(topic) {
  return topic
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim();
}

/**
 * Generate tags from a topic
 * @param {string} topic - The topic string
 * @returns {string[]} - Array of relevant tags
 */
function generateTags(topic) {
  const commonTags = {
    'microphone': ['audio', 'recording', 'streaming'],
    'headset': ['gaming', 'audio', 'communication'],
    'laptop': ['tech', 'computing', 'productivity'],
    'monitor': ['display', 'gaming', 'productivity'],
    'keyboard': ['gaming', 'typing', 'mechanical'],
    'mouse': ['gaming', 'productivity', 'ergonomic'],
    'budget': ['affordable', 'value'],
    'gaming': ['esports', 'performance'],
    'wireless': ['bluetooth', 'freedom'],
    'professional': ['work', 'business']
  };

  const tags = new Set();
  const topicLower = topic.toLowerCase();

  // Add tags based on keywords found in topic
  Object.entries(commonTags).forEach(([keyword, relatedTags]) => {
    if (topicLower.includes(keyword)) {
      relatedTags.forEach(tag => tags.add(tag));
    }
  });

  // Extract year if present
  const yearMatch = topic.match(/20\d{2}/);
  if (yearMatch) {
    tags.add(yearMatch[0]);
  }

  // Add generic tags based on topic structure
  if (topicLower.includes('best')) tags.add('reviews');
  if (topicLower.includes('budget')) tags.add('budget');
  if (topicLower.includes('pro')) tags.add('professional');

  return Array.from(tags).slice(0, 6); // Limit to 6 tags
}

/**
 * Generate affiliate link (fake Amazon link for demo)
 * @param {string} productName - Name of the product
 * @returns {string} - Fake affiliate link
 */
function generateAffiliateLink(productName) {
  const slug = productName.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  return `https://amzn.to/${slug}-${Math.random().toString(36).substring(7)}`;
}

/**
 * Call OpenAI API to generate tier list content
 * @param {string} topic - The topic for the tier list
 * @returns {Promise<Object>} - Generated content object
 */
async function generateTierListContent(topic) {
  const prompt = `Create a tier list for "${topic}". 
  
Generate a JSON response with this exact structure:
{
  "title": "Best [Product] 2025",
  "description": "SEO-optimized description (140-160 characters)",
  "tiers": {
    "S": [
      {"name": "Product Name", "review": "Short compelling review (30-50 words)"},
      {"name": "Another Product", "review": "Another review"}
    ],
    "A": [
      {"name": "Product Name", "review": "Review"},
      {"name": "Product Name", "review": "Review"},
      {"name": "Product Name", "review": "Review"}
    ],
    "B": [
      {"name": "Product Name", "review": "Review"},
      {"name": "Product Name", "review": "Review"}
    ]
  }
}

Requirements:
- S tier: 1-2 premium products (best overall)
- A tier: 2-4 excellent products (great value)
- B tier: 1-3 good products (budget options)
- Reviews should be concise but informative
- Focus on real products that exist
- Make the description SEO-friendly and compelling`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert product reviewer creating affiliate marketing content. Generate accurate, helpful tier lists for products. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });

    const response = completion.choices[0].message.content.trim();
    
    // Clean up the response to ensure it's valid JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No valid JSON found in OpenAI response');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
}

/**
 * Generate MDX content from the tier list data
 * @param {Object} data - Generated tier list data
 * @param {string} topic - Original topic
 * @returns {string} - Complete MDX content
 */
function generateMDXContent(data, topic) {
  const slug = generateSlug(topic);
  const tags = generateTags(topic);
  const currentDate = new Date().toISOString().split('T')[0];

  // Generate the tiers object for the TierList component
  const tiersObject = {};
  const allProducts = [];
  
  Object.entries(data.tiers).forEach(([tier, products]) => {
    tiersObject[tier] = products.map(product => {
      const productLink = generateAffiliateLink(product.name);
      allProducts.push({
        name: product.name,
        url: productLink
      });
      return {
        ...product,
        link: productLink
      };
    });
  });

  const mdxContent = `---
title: ${data.title}
description: ${data.description}
pubDate: ${currentDate}
image: /images/${slug}.jpg
tags: [${tags.map(tag => `"${tag}"`).join(', ')}]
products: ${JSON.stringify(allProducts, null, 2)}
---

import TierList from '../../components/TierList.astro'

# ${data.title}

${data.description}

<TierList
  tiers={${JSON.stringify(tiersObject, null, 4).replace(/"/g, '"')}}
/>

## Buying Guide

When choosing the best products in this category, consider these key factors:

### Performance & Quality
Look for products that offer reliable performance and are built to last. Read user reviews and professional assessments to gauge long-term satisfaction.

### Value for Money
Consider the price-to-performance ratio. Sometimes paying a bit more upfront can save money in the long run through better durability and features.

### Features & Compatibility
Ensure the product has the features you need and is compatible with your existing setup or requirements.

## Frequently Asked Questions

**Q: How often should I upgrade?**
A: This depends on your usage patterns and needs. Generally, quality products in this category should serve you well for several years.

**Q: Are expensive options always better?**
A: Not necessarily. Our tier list considers value at every price point. Sometimes mid-range options offer the best balance of features and affordability.

**Q: Where can I find the best deals?**
A: Keep an eye on seasonal sales, manufacturer promotions, and authorized retailers for the best pricing on these recommended products.`;

  return mdxContent;
}

/**
 * Main function to generate tier list MDX file
 * @param {string} topic - The topic for the tier list
 */
async function generateTierList(topic) {
  try {
    console.log(`🚀 Generating tier list for: "${topic}"`);
    
    // Generate content using OpenAI with richer structure (pros/cons/specs and affiliate-ready)
    console.log('📡 Calling OpenAI API...');
    const data = await generateTierListContent(topic);
    
    // Generate MDX content
    console.log('📝 Creating MDX content...');
    const mdxContent = generateMDXContent(data, topic);
    
    // Create filename and path
    const slug = generateSlug(topic);
    const filename = `${slug}.mdx`;
    const outputPath = path.join(__dirname, '..', 'src', 'content', 'tierlists', filename);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    console.log('💾 Writing MDX file...');
    await fs.writeFile(outputPath, mdxContent, 'utf8');
    
    console.log(`✅ Successfully generated: ${filename}`);
    console.log(`📁 Location: ${outputPath}`);
    console.log(`🔗 Slug: ${slug}`);
    
    return {
      filename,
      path: outputPath,
      slug,
      title: data.title
    };
    
  } catch (error) {
    console.error('❌ Error generating tier list:', error);
    throw error;
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const topic = process.argv[2];
  
  if (!topic) {
    console.error('❌ Please provide a topic as an argument');
    console.log('Usage: node generate-tier.mjs "best USB microphones 2025"');
    process.exit(1);
  }
  
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment variables');
    console.log('Please add your OpenAI API key to the .env file');
    process.exit(1);
  }
  
  generateTierList(topic)
    .then((result) => {
      console.log('\n🎉 Generation complete!');
      console.log(`Title: ${result.title}`);
      console.log(`File: ${result.filename}`);
    })
    .catch((error) => {
      console.error('\n💥 Generation failed:', error.message);
      process.exit(1);
    });
}

export { generateTierList };
