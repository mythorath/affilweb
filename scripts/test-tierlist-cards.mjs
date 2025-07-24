#!/usr/bin/env node

/**
 * Test script to validate TierListCard component and image fallbacks
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTierListCards() {
  console.log('🎨 Testing TierListCard Component Design\n');
  
  try {
    // Check if component exists
    const componentPath = path.join(__dirname, '..', 'src', 'components', 'TierListCard.astro');
    const componentExists = await fs.access(componentPath).then(() => true).catch(() => false);
    
    console.log(`📦 TierListCard Component: ${componentExists ? '✅ Found' : '❌ Missing'}`);
    
    if (componentExists) {
      const componentContent = await fs.readFile(componentPath, 'utf-8');
      
      // Check for key features
      const features = {
        'TypeScript Props Interface': componentContent.includes('export interface Props'),
        'Image Fallback Support': componentContent.includes('fallbackImage'),
        'Responsive Design': componentContent.includes('md:') && componentContent.includes('lg:'),
        'Hover Effects': componentContent.includes('group-hover:'),
        'Loading Lazy': componentContent.includes('loading="lazy"'),
        'Alt Text': componentContent.includes('alt={title}'),
        'Date Formatting': componentContent.includes('toLocaleDateString'),
        'Tag Support': componentContent.includes('tags'),
        'Animation': componentContent.includes('transition'),
        'Accessibility': componentContent.includes('focus')
      };
      
      console.log('\n🎯 Component Features:');
      Object.entries(features).forEach(([feature, exists]) => {
        console.log(`   ${exists ? '✅' : '❌'} ${feature}`);
      });
    }
    
    // Check for placeholder image
    const placeholderPath = path.join(__dirname, '..', 'public', 'images', 'placeholder-tierlist.svg');
    const placeholderExists = await fs.access(placeholderPath).then(() => true).catch(() => false);
    
    console.log(`\n🖼️  Placeholder Image: ${placeholderExists ? '✅ Found' : '❌ Missing'}`);
    
    // Check if homepage uses the component
    const homepagePath = path.join(__dirname, '..', 'src', 'pages', 'index.astro');
    const homepageContent = await fs.readFile(homepagePath, 'utf-8');
    
    const homepageFeatures = {
      'Imports TierListCard': homepageContent.includes('import TierListCard'),
      'Grid Layout': homepageContent.includes('grid-cols-'),
      'Responsive Grid': homepageContent.includes('md:grid-cols-') && homepageContent.includes('lg:grid-cols-'),
      'Uses Component': homepageContent.includes('<TierListCard'),
      'Props Passed': homepageContent.includes('title={post.data.title}')
    };
    
    console.log('\n🏠 Homepage Integration:');
    Object.entries(homepageFeatures).forEach(([feature, exists]) => {
      console.log(`   ${exists ? '✅' : '❌'} ${feature}`);
    });
    
    // Simulate tier list data
    console.log('\n📊 Sample Card Data:');
    const sampleCards = [
      {
        title: 'Best Gaming Mice 2025',
        description: 'Top gaming mice ranked by performance, features, and value',
        image: '/images/gaming-mice.jpg',
        tags: ['gaming', 'mice', 'peripherals'],
        pubDate: '2025-07-23'
      },
      {
        title: 'Best Budget Laptops 2025',
        description: 'Top budget laptops ranked by value, performance, and build quality',
        image: null, // Test fallback
        tags: ['laptops', 'budget', 'tech'],
        pubDate: '2025-07-22'
      }
    ];
    
    sampleCards.forEach((card, index) => {
      console.log(`   Card ${index + 1}:`);
      console.log(`     Title: ${card.title}`);
      console.log(`     Image: ${card.image || 'Using fallback SVG'}`);
      console.log(`     Tags: ${card.tags.join(', ')}`);
      console.log(`     Date: ${new Date(card.pubDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`);
      console.log('');
    });
    
    console.log('✅ TierListCard component testing complete!');
    console.log('\n💡 Preview at: http://localhost:4321');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTierListCards();
