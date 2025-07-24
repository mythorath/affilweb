#!/usr/bin/env node

/**
 * Validation script to check tierlist routing and links
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateTierlistRouting() {
  console.log('🔍 Validating TrendTiers Routing\n');
  
  try {
    // Check if tierlists directory exists
    const tierlistsDir = path.join(__dirname, '..', 'src', 'content', 'tierlists');
    const files = await fs.readdir(tierlistsDir);
    const mdxFiles = files.filter(file => file.endsWith('.mdx'));
    
    console.log(`📁 Found ${mdxFiles.length} tierlist files:`);
    
    for (const file of mdxFiles) {
      const filePath = path.join(tierlistsDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const slugMatch = frontmatter.match(/slug:\s*(.+)/);
        
        const slug = file.replace('.mdx', '');
        const title = titleMatch ? titleMatch[1].trim() : 'No title';
        const frontmatterSlug = slugMatch ? slugMatch[1].trim() : 'No slug in frontmatter';
        
        console.log(`   ✅ ${file}`);
        console.log(`      Title: ${title}`);
        console.log(`      File slug: ${slug}`);
        console.log(`      Frontmatter slug: ${frontmatterSlug}`);
        console.log(`      Route: /${slug}`);
        console.log('');
      }
    }
    
    // Check homepage links
    console.log('🏠 Checking homepage category links:');
    const indexPath = path.join(__dirname, '..', 'src', 'pages', 'index.astro');
    const indexContent = await fs.readFile(indexPath, 'utf-8');
    
    const linkMatches = indexContent.match(/href="\/([^"]+)"/g) || [];
    const tierlistLinks = linkMatches.filter(link => !link.includes('demo') && link.includes('best-'));
    
    console.log('   Category card links:');
    tierlistLinks.forEach(link => {
      const href = link.match(/href="\/([^"]+)"/)[1];
      console.log(`      /${href}`);
    });
    
    console.log('\n✅ Routing validation complete!');
    console.log('\n💡 Test these URLs in your browser:');
    mdxFiles.forEach(file => {
      const slug = file.replace('.mdx', '');
      console.log(`   http://localhost:4321/${slug}`);
    });
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
  }
}

validateTierlistRouting();
