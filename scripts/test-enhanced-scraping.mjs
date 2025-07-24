#!/usr/bin/env node

import { fetchAmazonImage } from '../src/utils/amazon.js';

async function testEnhancedScraping() {
  console.log('🧪 Testing Enhanced Amazon Image Scraping\n');

  // Test with a few different ASINs
  const testASINs = [
    'B08N5WRWNW', // Sony WH-1000XM4
    'B003M2B8EE', // Herman Miller Aeron
    'B0863TXGM3', // Another Sony model
  ];

  for (const asin of testASINs) {
    console.log(`\n🔍 Testing ASIN: ${asin}`);
    console.log('─'.repeat(50));
    
    try {
      const startTime = Date.now();
      const imageUrl = await fetchAmazonImage(asin);
      const endTime = Date.now();
      
      if (imageUrl) {
        console.log(`✅ SUCCESS: Found image in ${endTime - startTime}ms`);
        console.log(`📷 Image URL: ${imageUrl}`);
        console.log(`📏 URL Length: ${imageUrl.length} characters`);
        
        // Validate the URL format
        if (imageUrl.includes('_AC_SL') || imageUrl.includes('images-na.ssl-images-amazon.com') || imageUrl.includes('m.media-amazon.com')) {
          console.log('✓ URL format looks valid');
        } else {
          console.log('? URL format is different than expected');
        }
      } else {
        console.log(`❌ FAILED: No image found in ${endTime - startTime}ms`);
      }
    } catch (error) {
      console.error(`💥 ERROR: ${error.message}`);
    }
  }

  console.log('\n🎉 Test completed!');
}

testEnhancedScraping().catch(console.error);
