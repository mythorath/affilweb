#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function buildAdsConfig(upYum) {
  const cfg = {
    meta: {
      generatedAt: new Date().toISOString(),
    },
    slots: {
      header: [],
      inline: [],
      sidebar: [],
      footer: []
    }
  };

  // Helper to add a banner
  const add = (slot, title, url, description = 'Sponsored') => {
    if (!url) return;
    cfg.slots[slot].push({ title, url, description });
  };

  // Populate simple network banners from UpYum IDs (non-secret)
  add('header', 'Booking Deals', upYum.BOOKING_AFF_ID ? `https://www.booking.com/index.html?aid=${upYum.BOOKING_AFF_ID}` : null, 'Travel deals');
  add('inline', 'HappyCow Vegan Finder', upYum.HAPPYCOW_ID ? `https://www.happycow.net/?a=${upYum.HAPPYCOW_ID}` : null, 'Find vegan options');
  add('sidebar', 'LegalZoom', upYum.LEGALZOOM_ID ? `https://www.legalzoom.com/?ref=${upYum.LEGALZOOM_ID}` : null, 'LLC and legal help');
  add('sidebar', 'Rocket Lawyer', upYum.ROCKETLAWYER_ID ? `https://www.rocketlawyer.com/?partner=${upYum.ROCKETLAWYER_ID}` : null, 'Legal documents');
  add('footer', 'Payhip Store', upYum.PAYHIP_API_TOKEN ? `https://payhip.com/` : null, 'Digital products');

  // Always include a house CTA
  cfg.slots.header.push({ title: 'Subscribe to TrendTiers', url: '/about', description: 'Get new rankings weekly' });
  cfg.slots.inline.push({ title: 'Support us via our affiliate links', url: '/affiliate-disclosure', description: 'It helps keep the site free' });
  cfg.slots.footer.push({ title: 'Latest Tier Lists', url: '/', description: 'See what’s new' });

  return cfg;
}

export async function generateAdsConfig() {
  try {
    const upYumPath = path.join(__dirname, '..', 'UpYum.json');
    const upYum = JSON.parse(await fs.readFile(upYumPath, 'utf-8'));
    const cfg = buildAdsConfig(upYum);
    const outDir = path.join(__dirname, '..', 'src', 'config');
    await fs.mkdir(outDir, { recursive: true });
    const outFile = path.join(outDir, 'ads.json');
    await fs.writeFile(outFile, JSON.stringify(cfg, null, 2), 'utf-8');
    console.log('📣 Generated ads config at src/config/ads.json');
  } catch (e) {
    console.warn('⚠️ Ads config generation skipped:', e.message);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  generateAdsConfig().catch(err => {
    console.error(err);
    process.exit(1);
  });
}


