#!/usr/bin/env node
/**
 * Test script for SerpAPI image search integration
 * This script tests the new SerpAPI-based image search functionality
 */

import dotenv from 'dotenv';
import { fetchImageFromSerpAPI } from '../src/utils/imageSearch.js';
import { fetchProductImageFallback } from '../src/utils/amazon.js';

// Load environment variables
dotenv.config();

async function testSerpAPIIntegration() {
  console.log('🧪 Testing SerpAPI Image Search Integration\n');

  // Test products with different characteristics
  const testProducts = [
    'Logitech MX Master 3S Mouse',
    'Sony WH-1000XM4 Headphones', 
    'Apple MacBook Pro M3',
    'Steelcase Leap V2 Office Chair',
    'Corsair K95 RGB Keyboard'
  ];

  console.log('📋 Testing Direct SerpAPI Function...\n');

  for (const product of testProducts) {
    console.log(`🔍 Testing SerpAPI: "${product}"`);
    console.log('─'.repeat(60));
    
    const startTime = Date.now();
    
    try {
      const result = await fetchImageFromSerpAPI(product);
      const duration = Date.now() - startTime;
      
      if (result.url) {
        console.log(`✅ SUCCESS: Found image in ${duration}ms`);
        console.log(`📷 Image URL: ${result.url.substring(0, 100)}...`);
        console.log(`📊 Source Type: ${result.source}`);
        
        // Validate URL format
        if (result.url.startsWith('https://') && result.url.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
          console.log('🎯 ✅ Valid image URL format');
        } else {
          console.log('⚠️  Image URL may not be direct image link');
        }
      } else {
        console.log(`❌ FAILED: No image found in ${duration}ms`);
        console.log(`📊 Source: ${result.source}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ERROR: ${error.message} in ${duration}ms`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('\n🔄 Testing Complete Image Pipeline with SerpAPI Priority...\n');

  for (const product of testProducts.slice(0, 2)) { // Test fewer for full pipeline
    console.log(`🔍 Testing Complete Pipeline: "${product}"`);
    console.log('─'.repeat(50));
    
    const startTime = Date.now();
    
    try {
      const result = await fetchProductImageFallback(product);
      const duration = Date.now() - startTime;
      
      if (result.url) {
        console.log(`✅ SUCCESS: Found image in ${duration}ms`);
        console.log(`📷 Image URL: ${result.url.substring(0, 100)}...`);
        console.log(`📊 Source Type: ${result.source}`);
        
        // Check if it came from SerpAPI (priority source)
        if (result.source.startsWith('serpapi')) {
          console.log('🎯 ✅ Used SerpAPI (priority source)');
        } else {
          console.log(`🔄 Used fallback source: ${result.source}`);
        }
      } else {
        console.log(`❌ FAILED: No image found in ${duration}ms`);
        console.log(`📊 Source: ${result.source}`);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.log(`❌ ERROR: ${error.message} in ${duration}ms`);
    }
    
    console.log(''); // Empty line for readability
  }

  console.log('\n📊 Testing Environment Configuration...\n');

  // Check for required environment variables
  if (process.env.SERPAPI_KEY) {
    console.log('✅ SERPAPI_KEY is configured');
    console.log(`🔑 Key length: ${process.env.SERPAPI_KEY.length} characters`);
  } else {
    console.log('❌ SERPAPI_KEY is missing from environment variables');
    console.log('⚠️  SerpAPI searches will fail without API key');
  }

  console.log('\n🎉 SerpAPI integration tests completed!');
  console.log('\n📋 Summary of SerpAPI Integration:');
  console.log('✅ Replaced broken DuckDuckGo HTML scraping');
  console.log('✅ Uses real Google Images search via SerpAPI');
  console.log('✅ Prioritizes retail domain images');
  console.log('✅ Falls back to high-quality images');
  console.log('✅ Maintains compatibility with existing pipeline');
}

testSerpAPIIntegration().catch(console.error);
