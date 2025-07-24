#!/usr/bin/env node
/**
 * Debug script to examine DuckDuckGo HTML structure
 * This will help us understand why our regex isn't finding images
 */

async function debugDuckDuckGoHTML() {
  console.log('🔍 Debugging DuckDuckGo HTML Structure...\n');
  
  const productName = 'Logitech MX Master 3S Mouse';
  const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(productName + ' product')}&t=h_&iax=images&ia=images`;
  
  console.log(`📡 Fetching: ${searchUrl}\n`);
  
  try {
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 10000
    });

    if (!response.ok) {
      console.error(`❌ Failed to fetch: ${response.status} ${response.statusText}`);
      return;
    }

    const html = await response.text();
    console.log(`✅ Retrieved HTML: ${html.length} characters\n`);
    
    // Let's examine what image-related content is in the HTML
    console.log('🔍 Searching for image-related patterns...\n');
    
    // Check for any img tags
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    console.log(`📷 Found ${imgTags.length} <img> tags:`);
    imgTags.slice(0, 5).forEach((tag, i) => {
      console.log(`  ${i + 1}. ${tag.substring(0, 200)}...`);
    });
    
    console.log('\n🔍 Searching for JSON-like image data...\n');
    
    // Look for URLs that might be images
    const urlPattern = /https?:\/\/[^\s"'<>]+\.(?:jpg|jpeg|png|webp|gif)/gi;
    const imageUrls = html.match(urlPattern) || [];
    console.log(`🌐 Found ${imageUrls.length} potential image URLs:`);
    imageUrls.slice(0, 10).forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    
    console.log('\n🔍 Looking for width/height attributes...\n');
    
    // Look for width/height patterns
    const dimensionPattern = /(?:width|height)="(\d+)"/gi;
    const dimensions = [];
    let match;
    while ((match = dimensionPattern.exec(html)) !== null) {
      dimensions.push(match[1]);
    }
    console.log(`📏 Found ${dimensions.length} width/height values: ${dimensions.slice(0, 20).join(', ')}`);
    
    console.log('\n🔍 Looking for our exact regex pattern...\n');
    
    // Test our exact regex
    const ourRegex = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp)(?:\?[^"]*)?)"[^>]*(?:width|height)="(?:500|800|1024|1200|1500|2000)/gi;
    const ourMatches = [];
    while ((match = ourRegex.exec(html)) !== null) {
      ourMatches.push(match[1]);
    }
    console.log(`🎯 Our regex found ${ourMatches.length} matches:`);
    ourMatches.forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    
    console.log('\n🔍 Trying broader regex patterns...\n');
    
    // Try a simpler pattern
    const simplePattern = /"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/gi;
    const simpleMatches = [];
    while ((match = simplePattern.exec(html)) !== null) {
      simpleMatches.push(match[1]);
    }
    console.log(`🔎 Simple regex found ${simpleMatches.length} image URLs:`);
    simpleMatches.slice(0, 10).forEach((url, i) => {
      console.log(`  ${i + 1}. ${url}`);
    });
    
    console.log('\n🔍 Looking for JavaScript data structures...\n');
    
    // Look for JSON-like structures that might contain image data
    const jsonPattern = /\{[^{}]*"[^"]*(?:url|src|image)[^"]*":\s*"[^"]*\.(?:jpg|jpeg|png|webp)[^"]*"[^{}]*\}/gi;
    const jsonMatches = html.match(jsonPattern) || [];
    console.log(`📊 Found ${jsonMatches.length} JSON-like structures with image URLs:`);
    jsonMatches.slice(0, 3).forEach((json, i) => {
      console.log(`  ${i + 1}. ${json.substring(0, 300)}...`);
    });
    
    // Save a sample of the HTML for manual inspection
    console.log('\n💾 Saving HTML sample for manual inspection...');
    const fs = await import('fs');
    const sampleHtml = html.substring(0, 10000); // First 10KB
    await fs.promises.writeFile('debug-duckduckgo-sample.html', sampleHtml, 'utf8');
    console.log('✅ Saved debug-duckduckgo-sample.html (first 10KB)');
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

debugDuckDuckGoHTML();
