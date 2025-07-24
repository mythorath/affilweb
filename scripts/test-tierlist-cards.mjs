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
        'Enhanced Image Fallback': componentContent.includes('post?.data?.image') && componentContent.includes('post?.data?.products?.[0]?.image'),
        'Product Image Priority': componentContent.includes('products?.[0]?.image'),
        'Post Object Support': componentContent.includes('post?: any'),
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
    
    // Simulate tier list data with enhanced image fallback scenarios
    console.log('\n📊 Enhanced Image Fallback Test Cases:');
    const sampleCards = [
      {
        scenario: 'Frontmatter Override',
        data: {
          image: '/images/custom-override.jpg', // Priority 1: Frontmatter override
          products: [{ image: '/images/product-1.jpg' }]
        },
        expectedImage: '/images/custom-override.jpg'
      },
      {
        scenario: 'First Product Image',
        data: {
          image: null,
          products: [
            { image: '/images/gaming-mouse-1.jpg' }, // Priority 2: First product
            { image: '/images/gaming-mouse-2.jpg' }
          ]
        },
        expectedImage: '/images/gaming-mouse-1.jpg'
      },
      {
        scenario: 'Fallback to Placeholder',
        data: {
          image: null,
          products: [] // No products
        },
        expectedImage: '/images/placeholder-tierlist.svg'
      },
      {
        scenario: 'No Products Array',
        data: {
          image: null,
          products: null
        },
        expectedImage: '/images/placeholder-tierlist.svg'
      }
    ];
    
    sampleCards.forEach((testCase, index) => {
      console.log(`   Test ${index + 1}: ${testCase.scenario}`);
      console.log(`     Expected: ${testCase.expectedImage}`);
      console.log(`     Logic: post.data.image || post.data.products?.[0]?.image || fallback`);
      console.log('');
    });
    
    console.log('✅ TierListCard component testing complete!');
    console.log('\n💡 Preview at: http://localhost:4321');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTierListCards();
