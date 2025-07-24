#!/usr/bin/env node

import * as cheerio from 'cheerio';

async function debugAmazonScraping() {
  const asin = 'B08N5WRWNW';
  const productUrl = `https://www.amazon.com/dp/${asin}`;
  
  console.log(`🔍 Debug scraping for: ${productUrl}\n`);

  try {
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000,
    });

    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.log('❌ Failed to fetch page');
      return;
    }

    const html = await response.text();
    console.log(`📄 HTML length: ${html.length} characters`);
    
    // Check if we got blocked
    if (html.includes('Robot Check') || html.includes('captcha') || html.includes('blocked')) {
      console.log('🚫 Detected bot blocking or captcha');
      return;
    }

    const $ = cheerio.load(html);
    
    // Debug: Check what we can find
    console.log('\n🔍 Debugging selectors:');
    console.log(`#landingImage elements: ${$('#landingImage').length}`);
    console.log(`img[data-a-dynamic-image] elements: ${$('img[data-a-dynamic-image]').length}`);
    console.log(`img elements total: ${$('img').length}`);
    
    // Show first few image src attributes
    console.log('\n📷 First 5 image sources found:');
    $('img').slice(0, 5).each((i, el) => {
      const src = $(el).attr('src');
      const dataDynamic = $(el).attr('data-a-dynamic-image');
      console.log(`  ${i + 1}. src: ${src ? src.substring(0, 80) + '...' : 'none'}`);
      if (dataDynamic) {
        console.log(`     data-a-dynamic-image: ${dataDynamic.substring(0, 100)}...`);
      }
    });

    // Check for any Amazon image patterns in the HTML
    console.log('\n🔎 Searching for Amazon image patterns in HTML...');
    const patterns = [
      /https:\/\/[^"]*images-na\.ssl-images-amazon\.com[^"]*/g,
      /https:\/\/[^"]*m\.media-amazon\.com[^"]*/g,
      /"hiRes":"([^"]+)"/g,
      /"large":"([^"]+)"/g,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const matches = html.match(patterns[i]);
      if (matches) {
        console.log(`  Pattern ${i + 1}: Found ${matches.length} matches`);
        console.log(`    First match: ${matches[0].substring(0, 100)}...`);
      } else {
        console.log(`  Pattern ${i + 1}: No matches`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

debugAmazonScraping().catch(console.error);
