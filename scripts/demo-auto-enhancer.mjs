#!/usr/bin/env node
/**
 * Demo script showing the tierlist auto-enhancer in action
 * This creates a sample tierlist and then enhances it with SerpAPI images
 */

import fs from 'fs/promises';
import { enhanceTierlistWithImages } from './enhance-tierlists-with-images.mjs';

async function demoAutoEnhancer() {
  console.log('🎮 Tierlist Auto-Enhancer Demo\n');
  
  // Create a sample tierlist with missing images
  const sampleTierlist = `---
title: Demo Gaming Keyboards 2025
description: Demo tier list for auto-enhancement showcase
pubDate: 2025-07-23
image: /images/gaming-keyboards.jpg
tags: [gaming, keyboards, peripherals]
---

import TierList from '../../components/TierList.astro'

# Demo Gaming Keyboards 2025

This is a demo tierlist to showcase the auto-enhancement feature.

<TierList
  tiers={{
    "S": [
      { 
        name: "Corsair K100 RGB", 
        review: "Premium mechanical keyboard with OPX switches and advanced RGB lighting.", 
        link: "https://amzn.to/corsair-k100"
      }
    ],
    "A": [
      { 
        name: "Logitech G915 TKL", 
        review: "Low-profile wireless mechanical keyboard with excellent build quality.", 
        link: "https://amzn.to/logitech-g915-tkl",
        image: ""
      }
    ]
  }}
/>

## Summary

Top-tier gaming keyboards for competitive and casual gaming.`;

  const demoPath = 'src/content/tierlists/demo-keyboards-2025.mdx';
  
  try {
    // Create the demo file
    console.log('📝 Creating demo tierlist with missing images...');
    await fs.writeFile(demoPath, sampleTierlist, 'utf8');
    console.log('✅ Demo file created\n');
    
    // Show before content
    console.log('🔍 BEFORE enhancement:');
    console.log('- Corsair K100 RGB: ❌ No image');
    console.log('- Logitech G915 TKL: ❌ Empty image field\n');
    
    // Enhance it
    console.log('🚀 Running auto-enhancer...\n');
    const wasEnhanced = await enhanceTierlistWithImages(demoPath);
    
    if (wasEnhanced) {
      console.log('\n✅ AFTER enhancement:');
      console.log('- Corsair K100 RGB: ✅ SerpAPI retail image added');
      console.log('- Logitech G915 TKL: ✅ SerpAPI retail image added\n');
      
      console.log('🎉 Demo complete! Check the enhanced file:');
      console.log(`📁 ${demoPath}`);
    } else {
      console.log('\n⚠️  No enhancement was needed or an error occurred');
    }
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  } finally {
    // Clean up demo file
    try {
      await fs.unlink(demoPath);
      console.log('\n🧹 Demo file cleaned up');
    } catch (error) {
      // File might not exist, that's ok
    }
  }
}

demoAutoEnhancer();
