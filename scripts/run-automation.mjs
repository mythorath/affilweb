#!/usr/bin/env node

// TrendTiers Orchestrator: Discover → Generate → Enhance → Validate
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TIERLISTS_DIR = path.join(__dirname, '..', 'src', 'content', 'tierlists');

async function loadUpYumEnv() {
  try {
    const upYumPath = path.join(__dirname, '..', 'UpYum.json');
    const json = await fs.readFile(upYumPath, 'utf-8');
    const data = JSON.parse(json);
    for (const [key, value] of Object.entries(data)) {
      if (process.env[key] === undefined && typeof value === 'string') {
        process.env[key] = value;
      }
    }
    console.log('🔑 Loaded credentials from UpYum.json');
  } catch (e) {
    // Optional file; skip if not present
  }
}

async function runAffiliateFixAll(enhanceTierlistWithAffiliateLinks) {
  const files = await fs.readdir(TIERLISTS_DIR);
  const mdxFiles = files.filter(f => f.endsWith('.mdx'));
  for (const file of mdxFiles) {
    await enhanceTierlistWithAffiliateLinks(path.join(TIERLISTS_DIR, file));
  }
}

async function main() {
  console.log('🚀 TrendTiers Automation Orchestrator');
  await loadUpYumEnv();
  console.log('🔧 Using tag:', process.env.AMAZON_ASSOCIATE_TAG || 'mythorath-20');

  // Dynamic imports AFTER env is loaded
  const { default: generateTierlist } = await import('./generate-tierlist.mjs');
  const { enhanceAllTierlists } = await import('./enhance-tierlists-with-images.mjs');
  const { enhanceAllTierlistsWithReviews } = await import('./enhance-tierlists-with-reviews.mjs');
  const { enhanceTierlistWithAffiliateLinks } = await import('./enhance-tierlists-with-affiliate-links.mjs');

  // 1) Generate one new tierlist
  await generateTierlist();

  // 2) Enhance all tierlists with images
  await enhanceAllTierlists(TIERLISTS_DIR);

  // 3) Enhance all tierlists with AI reviews
  await enhanceAllTierlistsWithReviews(TIERLISTS_DIR);

  // 3.5) Generate ad config to be consumed by UI
  try {
    const { generateAdsConfig } = await import('./generate-ads-config.mjs');
    await generateAdsConfig();
  } catch (e) {
    // Non-fatal for pipeline; ads are optional
    console.warn('⚠️ Ads config generation failed:', e?.message || e);
  }

  // 4) Ensure affiliate links present/correct
  await runAffiliateFixAll(enhanceTierlistWithAffiliateLinks);

  // 5) Optional: Auto-commit changes if GIT_AUTOCOMMIT=true
  if ((process.env.GIT_AUTOCOMMIT || '').toLowerCase() === 'true') {
    try {
      await exec('git add -A');
      await exec('git commit -m "chore: automated tierlist generation and enhancements"');
      if (process.env.GIT_PUSH?.toLowerCase() === 'true') {
        await exec('git push');
      }
      console.log('📦 Changes committed');
    } catch (e) {
      console.warn('⚠️ Auto-commit skipped:', e.message);
    }
  }

  console.log('✅ Automation pipeline complete');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(err => {
    console.error('❌ Orchestrator failed:', err);
    process.exit(1);
  });
}


