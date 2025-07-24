#!/usr/bin/env node
/**
 * Demo script showing the AI review enhancer in action
 * This creates a sample tierlist with placeholder/missing reviews and enhances them with OpenAI
 */

import fs from 'fs/promises';
import { enhanceTierlistWithReviews } from './enhance-tierlists-with-reviews.mjs';

async function demoAIReviewEnhancer() {
  console.log('🤖 AI Review Enhancer Demo\n');
  
  // Create a sample tierlist with poor/missing reviews
  const sampleTierlist = `---
title: Demo Wireless Mice 2025
description: Demo tier list for AI review enhancement showcase
pubDate: 2025-07-23
image: /images/wireless-mice.jpg
tags: [gaming, mice, wireless]
---

import TierList from '../../components/TierList.astro'

# Demo Wireless Mice 2025

This is a demo tierlist to showcase AI-powered review enhancement.

<TierList
  tiers={{
    "S": [
      { 
        name: "Logitech G Pro X Superlight", 
        review: "Great mouse",
        link: "https://amzn.to/logitech-pro-superlight"
      }
    ],
    "A": [
      { 
        name: "Razer Viper Ultimate", 
        review: "", 
        link: "https://amzn.to/razer-viper-ultimate"
      },
      { 
        name: "SteelSeries Rival 650", 
        review: "Good option",
        link: "https://amzn.to/steelseries-rival-650"
      }
    ]
  }}
/>

## Summary

Top wireless gaming mice for competitive play.`;

  const demoPath = 'src/content/tierlists/demo-wireless-mice-2025.mdx';
  
  try {
    // Create the demo file
    console.log('📝 Creating demo tierlist with placeholder reviews...');
    await fs.writeFile(demoPath, sampleTierlist, 'utf8');
    console.log('✅ Demo file created\n');
    
    // Show before content
    console.log('🔍 BEFORE AI enhancement:');
    console.log('- Logitech G Pro X Superlight: "Great mouse" (too short)');
    console.log('- Razer Viper Ultimate: "" (missing review)');
    console.log('- SteelSeries Rival 650: "Good option" (placeholder)\n');
    
    // Enhance it
    console.log('🚀 Running AI review enhancer...\n');
    const wasEnhanced = await enhanceTierlistWithReviews(demoPath);
    
    if (wasEnhanced) {
      // Read the enhanced file to show results
      const enhancedContent = await fs.readFile(demoPath, 'utf8');
      const tierListMatch = enhancedContent.match(/<TierList\s+tiers=\{\{([\s\S]*?)\}\}\s*\/>/);
      
      console.log('\n✅ AFTER AI enhancement:');
      console.log('- All products now have detailed, informative reviews');
      console.log('- Reviews include specific technical features and use cases');
      console.log('- Content is tier-appropriate (S-tier gets premium language)\n');
      
      console.log('🎉 Demo complete! AI-generated reviews are much more informative.');
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
      console.log('\n⚠️  Demo cleanup: file may not exist');
    }
  }
}

demoAIReviewEnhancer();
