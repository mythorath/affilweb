#!/usr/bin/env node

// Test script for Amazon image fetching functionality
import { fetchAmazonImage, fetchAmazonImagesBatch, extractASIN } from '../src/utils/amazon.js';

/**
 * Test the Amazon image fetching functions
 */
async function testAmazonImageFetching() {
  console.log('🧪 Testing Amazon Image Fetching Functions\n');

  // Test ASINs - mix of real and fake for demonstration
  const testASINs = [
    'B08N5WRWNW', // Sony WH-1000XM4 (should work)
    'B003M2B8EE', // Herman Miller Aeron (should work)  
    'B0FAKETEST', // Fake ASIN (should fail)
  ];

  console.log('📋 Testing individual image fetching...');
  for (const asin of testASINs) {
    console.log(`\n🔍 Testing ASIN: ${asin}`);
    try {
      const imageUrl = await fetchAmazonImage(asin);
      if (imageUrl) {
        console.log(`✅ Success: ${imageUrl}`);
      } else {
        console.log(`❌ No image found`);
      }
    } catch (error) {
      console.log(`💥 Error: ${error.message}`);
    }
  }

  console.log('\n📦 Testing batch image fetching...');
  try {
    const batchResults = await fetchAmazonImagesBatch(testASINs.slice(0, 2), 500); // Faster for testing
    console.log('\n📊 Batch Results:');
    for (const [asin, imageUrl] of Object.entries(batchResults)) {
      console.log(`  ${asin}: ${imageUrl ? '✅ Found' : '❌ Not found'}`);
    }
  } catch (error) {
    console.log(`💥 Batch Error: ${error.message}`);
  }

  console.log('\n🔗 Testing ASIN extraction from URLs...');
  const testUrls = [
    'https://www.amazon.com/Sony-WH-1000XM4-Canceling-Headphones-phone-call/dp/B0863TXGM3/',
    'https://amazon.com/dp/B08N5WRWNW',
    'B003M2B8EE', // Direct ASIN
  ];

  for (const url of testUrls) {
    const asin = extractASIN(url) || url;
    console.log(`🔗 ${url} → ASIN: ${asin}`);
  }
}

// Run the test if this script is executed directly
if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  testAmazonImageFetching()
    .then(() => {
      console.log('\n🎉 Testing complete!');
    })
    .catch(error => {
      console.error('\n💥 Test failed:', error);
      process.exit(1);
    });
}

export { testAmazonImageFetching };
