#!/usr/bin/env node

/**
 * Demo script for affiliate link enhancement
 * Creates a test tierlist with various link scenarios to validate the enhancement logic
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { enhanceTierlistWithAffiliateLinks } from './enhance-tierlists-with-affiliate-links.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a demo tierlist with various affiliate link scenarios
const demoTierlistContent = `---
title: Best Gaming Keyboards 2025 - Demo
description: Demo tierlist for testing affiliate link enhancement
pubDate: 2025-07-23
slug: demo-gaming-keyboards-2025
image: /images/gaming-keyboards.jpg
tags: [gaming, keyboards, peripherals]
---

import TierList from '../../components/TierList.astro'

<TierList
  tiers={{
    "S": [
      { 
        name: "Corsair K100 RGB", 
        review: "Premium mechanical keyboard with excellent build quality",
        link: ""
      },
      { 
        name: "Logitech G915 TKL", 
        review: "Wireless low-profile mechanical with great battery life",
        link: "https://www.amazon.com/dp/B085RMD5TP"
      }
    ],
    "A": [
      { 
        name: "Razer BlackWidow V4 Pro", 
        review: "Feature-packed gaming keyboard with solid performance",
        link: "https://www.amazon.com/dp/B0BQZXVHP4?tag=wrongtag-20"
      },
      { 
        name: "SteelSeries Apex Pro TKL", 
        review: "Adjustable actuation with premium feel",
        link: "https://amzn.to/3XYZ123?tag=mythorath-20"
      }
    ],
    "B": [
      { 
        name: "HyperX Alloy FPS Pro", 
        review: "Budget-friendly option with good build quality",
        link: "https://www.bestbuy.com/some-non-amazon-link"
      },
      { 
        name: "Keychron K2", 
        review: "Great for Mac users and wireless connectivity"
      }
    ]
  }}
/>

## Why These Rankings?

This demo tierlist showcases various affiliate link scenarios:
- **Empty links** that need Amazon search URLs
- **Amazon links without affiliate tags** that need our tag added
- **Amazon links with wrong tags** that need tag correction  
- **Amazon links with correct tags** that should be preserved
- **Non-Amazon links** that should be replaced with Amazon search
- **Missing links** that need to be generated

The enhancement script will automatically fix all these scenarios while preserving the MDX formatting.
`;

async function runDemo() {
  console.log('🎮 Demo: Affiliate Link Enhancement\n');
  
  const demoFilePath = path.join(__dirname, '..', 'src', 'content', 'tierlists', 'demo-affiliate-links.mdx');
  
  try {
    // Create demo file
    console.log('📝 Creating demo tierlist file...');
    await fs.writeFile(demoFilePath, demoTierlistContent, 'utf-8');
    console.log(`✅ Created: ${path.basename(demoFilePath)}\n`);
    
    // Show original content
    console.log('📋 Original affiliate links:');
    const originalContent = await fs.readFile(demoFilePath, 'utf-8');
    const linkMatches = originalContent.match(/link:\s*"([^"]*)"/g) || [];
    linkMatches.forEach(match => {
      const link = match.replace(/link:\s*"([^"]*)"/, '$1');
      console.log(`   ${link || '(empty)'}`);
    });
    console.log('');
    
    // Run enhancement
    console.log('🔗 Running affiliate link enhancement...\n');
    const result = await enhanceTierlistWithAffiliateLinks(demoFilePath);
    
    if (result.success) {
      console.log('\n📋 Enhanced affiliate links:');
      const enhancedContent = await fs.readFile(demoFilePath, 'utf-8');
      const enhancedLinkMatches = enhancedContent.match(/link:\s*"([^"]*)"/g) || [];
      enhancedLinkMatches.forEach(match => {
        const link = match.replace(/link:\s*"([^"]*)"/, '$1');
        console.log(`   ${link}`);
      });
      
      console.log('\n✅ Demo completed successfully!');
      console.log(`📁 Demo file: ${demoFilePath}`);
      
    } else {
      console.error('❌ Demo failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Demo error:', error.message);
  }
}

// Run demo
runDemo();
