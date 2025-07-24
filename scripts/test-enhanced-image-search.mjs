#!/usr/bin/env node

import dotenv from 'dotenv';
import { 
  fetchProductImageFromSearchEngine,
  fetchProductImageFallback,
  fetchAmazonImage 
} from '../src/utils/amazon.js';

// Load environment variables
dotenv.config();

/**
 * Test the new search engine image fetching functionality
 */
async function testSearchEngineImageFetching() {
  console.log('🧪 Testing Enhanced Search Engine Image Fetching\n');

  // Test products that should have retail domain images
  const testProducts = [
    'Logitech MX Master 3S Mouse',
    'Sony WH-1000XM4 Headphones', 
    'Apple MacBook Pro M3',
    'ASUS ROG Strix Gaming Laptop',
    'Corsair K95 RGB Keyboard'
  ];

  console.log('📋 Testing Search Engine Priority (Retail Domains)...\n');
  
  for (const productName of testProducts) {
    console.log(`🔍 Testing Search Engine: "${productName}"`);
    console.log('─'.repeat(60));
    
    try {
      const startTime = Date.now();
      const searchResult = await fetchProductImageFromSearchEngine(productName);
      const endTime = Date.now();
      
      if (searchResult.url) {
        console.log(`✅ SUCCESS: Found search engine image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${searchResult.url.substring(0, 100)}...`);
        console.log(`📊 Source Type: ${searchResult.source}`);
        
        // Analyze the domain
        try {
          const url = new URL(searchResult.url);
          console.log(`🌐 Domain: ${url.hostname}`);
          
          // Check if it's from a preferred retail domain
          const retailDomains = [
            'amazon.com', 'bestbuy.com', 'newegg.com', 'walmart.com',
            'logitech.com', 'corsair.com', 'sony.com', 'apple.com'
          ];
          
          const isRetailDomain = retailDomains.some(domain => url.hostname.includes(domain));
          if (isRetailDomain) {
            console.log('🎯 ✅ Found image from preferred retail domain!');
          } else {
            console.log('📸 Image from generic domain');
          }
          
        } catch (error) {
          console.log('❌ Invalid URL format');
        }
        
      } else {
        console.log(`❌ FAILED: No search engine image found in ${endTime - startTime}ms`);
        console.log(`📊 Source: ${searchResult.source}`);
      }
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
    
    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🔄 Testing Complete Image Pipeline with Source Tracking...\n');
  
  // Test complete pipeline including fallback
  const pipelineTests = [
    { name: 'HyperX Cloud Alpha Headset', expectSource: ['search_engine_retail', 'search_engine', 'unsplash'] },
    { name: 'Steelcase Leap V2 Office Chair', expectSource: ['search_engine_retail', 'unsplash'] }
  ];

  for (const test of pipelineTests) {
    console.log(`🔍 Testing Complete Pipeline: "${test.name}"`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await fetchProductImageFallback(test.name);
      const endTime = Date.now();
      
      if (result.url) {
        console.log(`✅ SUCCESS: Found image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${result.url.substring(0, 80)}...`);
        console.log(`📊 Source Type: ${result.source}`);
        
        // Check if source matches expectations
        if (test.expectSource.includes(result.source)) {
          console.log(`🎯 ✅ Source matches expectations (${result.source})`);
        } else {
          console.log(`⚠️  Unexpected source: ${result.source} (expected: ${test.expectSource.join(', ')})`);
        }
        
        // Validate image URL format
        if (result.url.match(/\.(jpg|jpeg|png|webp)(\?.*)?$/i)) {
          console.log('✅ Image URL has valid extension');
        } else {
          console.log('⚠️  Image URL may not be direct image link');
        }
        
      } else {
        console.log(`❌ FAILED: No image found in ${endTime - startTime}ms`);
        console.log(`📊 Source: ${result.source}`);
      }
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  console.log('\n📊 Testing Source Tracking with ASIN Lookup...\n');
  
  // Test with mock ASINs to see source tracking through complete pipeline
  const asinTests = [
    { asin: 'B08N5WRWNW', description: 'Mock ASIN - should trigger fallback' }
  ];

  for (const test of asinTests) {
    console.log(`🔍 Testing ASIN Pipeline: ${test.asin} (${test.description})`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const result = await fetchAmazonImage(test.asin);
      const endTime = Date.now();
      
      console.log(`📊 Final Result: ${result.url ? 'SUCCESS' : 'FAILED'} in ${endTime - startTime}ms`);
      console.log(`📊 Source Chain: ${result.source}`);
      
      if (result.url) {
        console.log(`📷 Image URL: ${result.url.substring(0, 80)}...`);
        
        // Track the complete source chain
        const sourceChain = {
          'amazon_cdn': 'Amazon CDN Direct',
          'amazon_scraping': 'Amazon Page Scraping',
          'search_engine_retail': 'Search Engine (Retail Domain)',
          'search_engine': 'Search Engine (Generic)',
          'duckduckgo': 'DuckDuckGo API',
          'unsplash': 'Unsplash Stock Photos',
          'wikipedia': 'Wikipedia Images',
          'none': 'No Image Found',
          'error': 'Error Occurred'
        };
        
        console.log(`🔗 Source: ${sourceChain[result.source] || result.source}`);
      }
      
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
    
    console.log('');
  }

  console.log('🎉 Enhanced image fetching tests completed!');
  console.log('\n📋 Summary of New Features:');
  console.log('✅ Search engine image fetching with retail domain priority');
  console.log('✅ Comprehensive source tracking throughout pipeline');
  console.log('✅ Enhanced fallback strategy with multiple APIs');
  console.log('✅ Full image URL validation and format checking');
}

testSearchEngineImageFetching().catch(console.error);
