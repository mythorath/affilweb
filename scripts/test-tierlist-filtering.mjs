#!/usr/bin/env node

/**
 * Test script to validate tierlist filtering and slug handling
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testTierlistFiltering() {
  console.log('🧪 Testing Tierlist Filtering & Slug Logic\n');
  
  try {
    const tierlistsDir = path.join(__dirname, '..', 'src', 'content', 'tierlists');
    const files = await fs.readdir(tierlistsDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    console.log(`📁 Found ${mdxFiles.length} total MDX files:\n`);
    
    const processedFiles = [];
    
    for (const file of mdxFiles) {
      const filePath = path.join(tierlistsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const slugMatch = frontmatter.match(/slug:\s*(.+)/);
        
        const fileSlug = file.replace('.mdx', '');
        const frontmatterSlug = slugMatch ? slugMatch[1].trim() : null;
        const finalSlug = frontmatterSlug || fileSlug;
        const title = titleMatch ? titleMatch[1].trim() : 'No title';
        
        // Check if it's a demo file
        const isDemoFile = file.startsWith('demo-') || 
                          (frontmatterSlug && frontmatterSlug.startsWith('demo-')) ||
                          title.toLowerCase().includes('demo');
        
        const fileInfo = {
          filename: file,
          title,
          fileSlug,
          frontmatterSlug,
          finalSlug,
          isDemoFile,
          route: `/${finalSlug}`,
          shouldAppearOnHomepage: !isDemoFile
        };
        
        processedFiles.push(fileInfo);
        
        console.log(`📄 ${file}`);
        console.log(`   Title: ${title}`);
        console.log(`   File slug: ${fileSlug}`);
        console.log(`   Frontmatter slug: ${frontmatterSlug || 'None'}`);
        console.log(`   Final slug: ${finalSlug}`);
        console.log(`   Route: ${fileInfo.route}`);
        console.log(`   Is demo: ${isDemoFile ? '❌ YES (filtered)' : '✅ NO (shown)'}`);
        console.log(`   Homepage: ${fileInfo.shouldAppearOnHomepage ? '✅ Will appear' : '❌ Filtered out'}`);
        console.log('');
      }
    }
    
    const productionFiles = processedFiles.filter(f => !f.isDemoFile);
    
    console.log('📊 Summary:');
    console.log(`   Total files: ${processedFiles.length}`);
    console.log(`   Demo files (filtered): ${processedFiles.filter(f => f.isDemoFile).length}`);
    console.log(`   Production files (shown): ${productionFiles.length}`);
    console.log('');
    
    console.log('🌐 Routes that will appear on homepage:');
    productionFiles.forEach(file => {
      console.log(`   ${file.route} - "${file.title}"`);
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testTierlistFiltering();
