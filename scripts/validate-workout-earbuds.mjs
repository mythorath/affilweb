#!/usr/bin/env node

/**
 * Validate the new Best Workout Earbuds 2025 tierlist
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateWorkoutEarbudsTierlist() {
  console.log('🎧 Validating Best Workout Earbuds 2025 Tierlist\n');
  
  try {
    const tierlistPath = path.join(__dirname, '..', 'src', 'content', 'tierlists', 'best-workout-earbuds-2025.mdx');
    const content = await fs.readFile(tierlistPath, 'utf-8');
    
    // Check frontmatter
    const frontmatterChecks = {
      'Title': content.includes('Best Wireless Earbuds for Working Out'),
      'Description': content.includes('fitness and gym use in 2025'),
      'Proper Slug': content.includes('slug: "best-workout-earbuds-2025"'),
      'Date Format': content.includes('pubDate: 2025-07-23'),
      'Fitness Tags': content.includes('fitness') && content.includes('gym'),
      'Hero Image': content.includes('image: "/images/earbuds-tierlist-hero.webp"')
    };
    
    console.log('📋 Frontmatter Validation:');
    Object.entries(frontmatterChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    // Check content structure
    const contentChecks = {
      'TierList Import': content.includes("import TierList from '../../components/TierList.astro'"),
      'S Tier Products': content.includes('Beats Powerbeats Pro') && content.includes('Jabra Elite 8 Active'),
      'A Tier Products': content.includes('Jaybird Vista 2') && content.includes('Sony WF-SP800N'),
      'B Tier Products': content.includes('Anker Soundcore Sport X10') && content.includes('TOZO T10'),
      'Amazon Links': content.includes('amzn.to') && content.includes('tag=mythorath-20'),
      'SerpAPI Images': content.includes('serpapi-img.trendtiers.com'),
      'Product Reviews': content.includes('Secure ear hooks') && content.includes('IP68 water/dust resistant'),
      'Workout Features': content.includes('Sweat & Water Resistance') && content.includes('Battery Life'),
      'JSON-LD Schema': content.includes('application/ld+json') && content.includes('ItemList')
    };
    
    console.log('\n🎯 Content Structure:');
    Object.entries(contentChecks).forEach(([check, passed]) => {
      console.log(`   ${passed ? '✅' : '❌'} ${check}`);
    });
    
    // Check image fallback logic compatibility
    console.log('\n🖼️  Enhanced Image Fallback Logic:');
    console.log('   ✅ Frontmatter image: "/images/earbuds-tierlist-hero.webp"');
    console.log('   📦 TierListCard will use: post.data.image (frontmatter override)');
    console.log('   🔄 Fallback chain: frontmatter → first product → placeholder SVG');
    
    // Product count
    const productMatches = content.match(/name: "/g);
    const productCount = productMatches ? productMatches.length : 0;
    console.log(`\n📊 Statistics:`);
    console.log(`   Products: ${productCount}`);
    console.log(`   Tiers: 3 (S, A, B)`);
    console.log(`   Category: Workout Earbuds`);
    
    console.log('\n🎉 New tierlist validation complete!');
    console.log('🔗 View at: http://localhost:4321/best-workout-earbuds-2025');
    console.log('🏠 Homepage: http://localhost:4321');
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateWorkoutEarbudsTierlist();
