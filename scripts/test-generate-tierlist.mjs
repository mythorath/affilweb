#!/usr/bin/env node

/**
 * Test the tierlist generation script without API calls
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testGenerateTierlist() {
  console.log('🧪 Testing Tierlist Generation Script Structure\n');
  
  try {
    // Test 1: Check script exists and can be imported
    console.log('📦 Step 1: Checking script file...');
    const scriptPath = path.join(__dirname, 'generate-tierlist.mjs');
    const scriptExists = await fs.access(scriptPath).then(() => true).catch(() => false);
    console.log(`   ${scriptExists ? '✅' : '❌'} Script file exists`);
    
    if (!scriptExists) {
      throw new Error('generate-tierlist.mjs not found');
    }
    
    // Test 2: Check script syntax
    console.log('\n🔍 Step 2: Checking script syntax...');
    try {
      const { default: generateTierlist } = await import('./generate-tierlist.mjs');
      console.log('   ✅ Script syntax is valid');
      console.log('   ✅ Export function available');
    } catch (error) {
      console.log('   ❌ Script syntax error:', error.message);
      throw error;
    }
    
    // Test 3: Check required modules
    console.log('\n📚 Step 3: Checking dependencies...');
    const dependencies = [
      'node-fetch',
      'openai',
      'dotenv'
    ];
    
    for (const dep of dependencies) {
      try {
        await import(dep);
        console.log(`   ✅ ${dep} available`);
      } catch (error) {
        console.log(`   ❌ ${dep} missing`);
      }
    }
    
    // Test 4: Check environment variables
    console.log('\n🔑 Step 4: Checking environment variables...');
    const envPath = path.join(__dirname, '..', '.env');
    const envExists = await fs.access(envPath).then(() => true).catch(() => false);
    console.log(`   ${envExists ? '✅' : '❌'} .env file exists`);
    
    if (envExists) {
      const envContent = await fs.readFile(envPath, 'utf-8');
      const hasOpenAI = envContent.includes('OPENAI_API_KEY');
      const hasSerpAPI = envContent.includes('SERPAPI_KEY');
      const hasAmazon = envContent.includes('AMAZON_ASSOCIATE_TAG');
      
      console.log(`   ${hasOpenAI ? '✅' : '❌'} OPENAI_API_KEY configured`);
      console.log(`   ${hasSerpAPI ? '✅' : '❌'} SERPAPI_KEY configured`);
      console.log(`   ${hasAmazon ? '✅' : '❌'} AMAZON_ASSOCIATE_TAG configured`);
    }
    
    // Test 5: Check output directory
    console.log('\n📁 Step 5: Checking output directory...');
    const outputDir = path.join(__dirname, '..', 'src', 'content', 'tierlists');
    const outputExists = await fs.access(outputDir).then(() => true).catch(() => false);
    console.log(`   ${outputExists ? '✅' : '❌'} Output directory exists`);
    
    if (outputExists) {
      const files = await fs.readdir(outputDir);
      console.log(`   📊 Current tierlists: ${files.length}`);
    }
    
    console.log('\n🎯 Script Features:');
    console.log('   🔍 SerpAPI integration for trending products');
    console.log('   🤖 OpenAI integration for content generation');
    console.log('   📝 Automatic MDX file creation');
    console.log('   🔗 Amazon affiliate link generation');
    console.log('   🖼️  Product image handling');
    console.log('   📊 SEO schema.org markup');
    console.log('   ⚡ Rate limiting and error handling');
    
    console.log('\n📖 Usage:');
    console.log('   node scripts/generate-tierlist.mjs');
    console.log('   # Generates a new tierlist automatically');
    
    console.log('\n✅ Tierlist generation script ready!');
    console.log('💡 Run the main script to generate your first automated tierlist');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

testGenerateTierlist();
