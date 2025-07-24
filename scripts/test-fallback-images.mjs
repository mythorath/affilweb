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
      const imageResult = await fetchProductImageFallback(productName);
      const endTime = Date.now();
      
      if (imageResult.url) {
        console.log(`✅ SUCCESS: Found fallback image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${imageResult.url}`);
        console.log(`📊 Image Source: ${imageResult.source}`);
        console.log(`📏 URL Length: ${imageResult.url.length} characters`);
        
        // Basic URL validation
        if (imageResult.url.startsWith('https://')) {
          console.log('✓ URL uses HTTPS');
        }
        
        // Check image source type
        if (imageResult.source === 'search_engine_retail') {
          console.log('🛒 Source: Search Engine (Retail Domain)');
        } else if (imageResult.source === 'search_engine') {
          console.log('🔍 Source: Search Engine (Generic)');
        } else if (imageResult.source === 'duckduckgo') {
          console.log('🦆 Source: DuckDuckGo API');
        } else if (imageResult.source === 'unsplash') {
          console.log('📸 Source: Unsplash');
        } else if (imageResult.source === 'wikipedia') {
          console.log('📖 Source: Wikipedia');
        } else {
          console.log(`🌐 Source: ${imageResult.source}`);
        }
      } else {
        console.log(`❌ FAILED: No fallback image found in ${endTime - startTime}ms (Source: ${imageResult.source})`);
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
      const imageResult = await fetchAmazonImage(asin);
      const endTime = Date.now();
      
      if (imageResult.url) {
        console.log(`✅ SUCCESS: Found image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${imageResult.url.substring(0, 80)}...`);
        console.log(`📊 Image Source: ${imageResult.source}`);
        
        if (imageResult.source === 'amazon_cdn') {
          console.log('🛒 Source: Amazon CDN');
        } else if (imageResult.source === 'amazon_scraping') {
          console.log('� Source: Amazon Scraping');
        } else if (imageResult.source === 'search_engine_retail') {
          console.log('🛒 Source: Search Engine (Retail)');
        } else {
          console.log(`🔄 Source: ${imageResult.source} (Fallback)`);
        }
      } else {
        console.log(`❌ FAILED: No image found in ${endTime - startTime}ms (Source: ${imageResult.source})`);
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
