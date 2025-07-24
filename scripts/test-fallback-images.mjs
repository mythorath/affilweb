#!/usr/bin/env node

import { fetchProductImageFallback, fetchAmazonImage } from '../src/utils/amazon.js';

async function testFallbackImageSearch() {
  console.log('🧪 Testing Fallback Image Search Functionality\n');

  // Test products with well-known names
  const testProducts = [
    'Steelcase Leap V2 Chair',
    'Herman Miller Aeron Chair',
    'Logitech MX Master 3S Mouse',
    'Sony WH-1000XM4 Headphones',
    'Apple MacBook Pro',
  ];

  console.log('📋 Testing direct fallback image search...\n');
  
  for (const productName of testProducts) {
    console.log(`🔍 Testing: "${productName}"`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const imageUrl = await fetchProductImageFallback(productName);
      const endTime = Date.now();
      
      if (imageUrl) {
        console.log(`✅ SUCCESS: Found fallback image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${imageUrl}`);
        console.log(`📏 URL Length: ${imageUrl.length} characters`);
        
        // Basic URL validation
        if (imageUrl.startsWith('https://')) {
          console.log('✓ URL uses HTTPS');
        }
        
        // Check image source
        if (imageUrl.includes('duckduckgo')) {
          console.log('🦆 Source: DuckDuckGo');
        } else if (imageUrl.includes('unsplash')) {
          console.log('📸 Source: Unsplash');
        } else if (imageUrl.includes('wikipedia')) {
          console.log('📖 Source: Wikipedia');
        } else {
          console.log('🌐 Source: Other');
        }
      } else {
        console.log(`❌ FAILED: No fallback image found in ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🔄 Testing integrated Amazon + fallback search...\n');
  
  // Test with some ASINs to see if fallback works when Amazon fails
  const testASINs = [
    'B08N5WRWNW', // Sony headphones
    'B003M2B8EE', // Herman Miller chair
  ];

  for (const asin of testASINs) {
    console.log(`🔍 Testing integrated search for ASIN: ${asin}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const imageUrl = await fetchAmazonImage(asin);
      const endTime = Date.now();
      
      if (imageUrl) {
        console.log(`✅ SUCCESS: Found image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${imageUrl.substring(0, 80)}...`);
        
        if (imageUrl.includes('amazon')) {
          console.log('🛒 Source: Amazon CDN');
        } else {
          console.log('🔄 Source: Fallback search');
        }
      } else {
        console.log(`❌ FAILED: No image found in ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('🎉 Fallback image search testing completed!');
}

testFallbackImageSearch().catch(console.error);
