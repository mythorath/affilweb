import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert title to kebab-case filename
 * @param {string} title - The title string
 * @returns {string} kebab-case filename
 */
function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-')     // Replace spaces with hyphens
    .replace(/-+/g, '-')      // Replace multiple hyphens with single
    .trim()
    .replace(/(^-+)|(-+$)/g, ''); // Remove leading/trailing hyphens
}

/**
 * Format the tiers object for MDX output
 * @param {Object} tiers - The tiers data
 * @returns {string} Formatted string for MDX
 */
function formatTiersForMDX(tiers) {
  const tiersString = JSON.stringify(tiers, null, 4)
    .replace(/"/g, '"')  // Use proper quotes
    .replace(/\n/g, '\n  '); // Indent properly
  
  return tiersString;
}

/**
 * Generate the complete MDX content
 * @param {Object} input - The tierlist input data
 * @returns {string} Complete MDX file content
 */
function generateMDXContent(input) {
  const { title, description, pubDate, image, tags, tiers, introText } = input;
  
  // Format tags array for frontmatter
  const tagsString = tags.map(tag => `"${tag}"`).join(', ');
  
  // Use introText if provided, otherwise use description
  const contentIntro = introText || description;
  
  const mdxContent = `---
title: ${title}
description: ${description}
pubDate: ${pubDate}
image: ${image}
tags: [${tagsString}]
---

import TierList from '../../components/TierList.astro'

# ${title}

${contentIntro}

<TierList
  tiers={${formatTiersForMDX(tiers)}}
/>

## About This Tier List

Our rankings are based on comprehensive testing, user reviews, and expert analysis. We consider factors like performance, value for money, build quality, and overall user satisfaction.

### How We Rank

- **S Tier**: Exceptional products that excel in all categories
- **A Tier**: Excellent products with minor compromises
- **B Tier**: Good products that offer solid value
- **C Tier**: Acceptable products with notable limitations

*Last updated: ${pubDate}*
`;

  return mdxContent;
}

/**
 * Write the MDX file to the tierlists directory
 * @param {Object} input - The tierlist input data
 * @returns {Promise<Object>} Promise with the generated file info
 */
async function generateTierlistFile(input) {
  try {
    // Generate slug and filename
    const slug = slugify(input.title);
    const filename = `${slug}.mdx`;
    const outputPath = path.join(__dirname, '..', 'src', 'content', 'tierlists', filename);
    
    // Generate MDX content
    const mdxContent = generateMDXContent(input);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write the file
    await fs.writeFile(outputPath, mdxContent, 'utf8');
    
    console.log(`✅ Generated tierlist: ${filename}`);
    console.log(`📁 Location: ${outputPath}`);
    
    return {
      filename,
      path: outputPath,
      slug
    };
    
  } catch (error) {
    console.error('❌ Error generating tierlist:', error);
    throw error;
  }
}

/**
 * Load JSON data from file or accept as parameter
 * @param {string} jsonPath - Path to JSON file (optional)
 * @param {Object} jsonData - Direct JSON data (optional)
 * @returns {Promise<Object>} Parsed tierlist data
 */
async function loadTierlistData(jsonPath, jsonData) {
  if (jsonData) {
    return jsonData;
  }
  
  if (jsonPath) {
    const jsonContent = await fs.readFile(jsonPath, 'utf8');
    return JSON.parse(jsonContent);
  }
  
  throw new Error('Either jsonPath or jsonData must be provided');
}

/**
 * Validate the input data structure
 * @param {any} data - The input data to validate
 */
function validateInput(data) {
  const required = ['title', 'description', 'pubDate', 'image', 'tags', 'tiers'];
  
  for (const field of required) {
    if (!(field in data)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  
  if (!Array.isArray(data.tags)) {
    throw new Error('tags must be an array');
  }
  
  if (typeof data.tiers !== 'object' || data.tiers === null) {
    throw new Error('tiers must be an object');
  }
  
  // Validate each tier
  for (const [tierName, products] of Object.entries(data.tiers)) {
    if (!Array.isArray(products)) {
      throw new Error(`Tier "${tierName}" must be an array of products`);
    }
    
    for (const product of products) {
      if (!product.name || !product.review || !product.link) {
        throw new Error(`Each product must have name, review, and link. Missing in tier "${tierName}"`);
      }
      
      // Validate image field if present (must be a string)
      if (product.image !== undefined && typeof product.image !== 'string') {
        throw new Error(`Product image must be a string URL. Invalid in tier "${tierName}" for product "${product.name}"`);
      }
    }
  }
  
  console.log('✅ Input validation passed');
}

// CLI interface
if (process.argv[1] && process.argv[1].endsWith('generateTierlist.mjs')) {
  const jsonPath = process.argv[2];
  
  if (!jsonPath) {
    console.error('❌ Please provide a JSON file path');
    console.log('Usage: node generateTierlist.mjs path/to/data.json');
    console.log('\nExample JSON structure:');
    console.log(JSON.stringify({
      title: "Best Gaming Mice 2025",
      description: "Top gaming mice ranked by performance, features, and value",
      pubDate: "2025-07-23",
      image: "/images/gaming-mice.jpg",
      tags: ["gaming", "mice", "peripherals", "2025"],
      introText: "Finding the perfect gaming mouse can make all the difference in your gameplay...",
      tiers: {
        "S": [
          {
            name: "Logitech G Pro X Superlight",
            review: "Ultra-lightweight wireless mouse with exceptional sensor accuracy",
            link: "https://amzn.to/logitech-gpro-x"
          }
        ],
        "A": [
          {
            name: "Razer DeathAdder V3",
            review: "Ergonomic design with excellent build quality and responsiveness",
            link: "https://amzn.to/razer-deathadder-v3"
          }
        ]
      }
    }, null, 2));
    process.exit(1);
  }
  
  console.log('🚀 Starting tierlist generation...');
  console.log('📄 Reading JSON file:', jsonPath);
  
  loadTierlistData(jsonPath)
    .then(data => {
      console.log('📋 Loaded data for:', data.title);
      validateInput(data);
      return generateTierlistFile(data);
    })
    .then(result => {
      console.log('\n🎉 Tierlist generation complete!');
      console.log(`Title: ${result.filename}`);
      console.log(`Slug: ${result.slug}`);
    })
    .catch(error => {
      console.error('\n💥 Generation failed:', error.message);
      process.exit(1);
    });
}

// Export functions for programmatic use
export { 
  generateTierlistFile, 
  loadTierlistData, 
  validateInput, 
  slugify
};
