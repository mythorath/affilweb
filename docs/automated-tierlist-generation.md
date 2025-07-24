# Automated Tierlist Generation

## 🤖 Overview

The `generate-tierlist.mjs` script automatically creates complete tierlist articles for TrendTiers.com using SerpAPI and OpenAI. It finds trending products, researches them, and generates professional MDX content with affiliate links and SEO optimization.

## 🔧 Features

### 🔍 **Product Discovery**
- Uses SerpAPI to find trending product categories
- Automatically extracts product names from search results
- Filters and deduplicates product lists

### 📚 **Product Research**
- Fetches product specifications and reviews via SerpAPI
- Collects product images and Amazon URLs
- Rate-limited API calls to respect service limits

### 🤖 **AI Content Generation**
- Uses OpenAI GPT-4 to rank products into S/A/B tiers
- Generates compelling product reviews and explanations
- Creates SEO-optimized titles, descriptions, and introductions

### 📝 **MDX File Creation**
- Outputs complete `.mdx` files with proper frontmatter
- Includes TierList component with structured product data
- Adds JSON-LD schema markup for SEO

### 🔗 **Affiliate Integration**
- Automatically creates Amazon affiliate links
- Uses your configured associate tag
- Handles product image sourcing

## 🚀 Usage

### Basic Usage
```bash
node scripts/generate-tierlist.mjs
```

This will:
1. Select a random trending category
2. Find top products in that category
3. Research each product for specs and reviews
4. Generate AI-powered tier rankings and reviews
5. Create a complete MDX file in `/src/content/tierlists/`

### Environment Variables Required
```env
OPENAI_API_KEY=sk-...
SERPAPI_KEY=your_serpapi_key
AMAZON_ASSOCIATE_TAG=your_tag-20
```

## 📊 Process Flow

### Step 1: Category Selection
- Randomly selects from predefined trending categories
- Categories include gaming, tech, home, and lifestyle products

### Step 2: Product Discovery
```javascript
// Uses SerpAPI to search for products
const searchUrl = `https://serpapi.com/search.json?engine=google&q=${category}&api_key=${serpApiKey}`;
```

### Step 3: Product Research
- Searches for detailed specs and reviews for each product
- Collects Amazon URLs and product images
- Rate limited at 1 request per second

### Step 4: AI Content Generation
```javascript
// OpenAI prompt for tier list generation
const prompt = `Create a tier list for "${category}" ranking products into S, A, B tiers...`;
```

### Step 5: MDX Generation
- Creates properly formatted frontmatter
- Generates TierList component with enriched product data
- Adds SEO schema markup

## 🎯 Configuration

### Trending Categories
```javascript
const trendingCategories = [
  'best gaming headsets 2025',
  'best wireless keyboards 2025',
  'best standing desks 2025',
  // ... more categories
];
```

### Rate Limiting
```javascript
const CONFIG = {
  maxProducts: 8,          // Products to research
  rateLimitMs: 1000,       // 1 second between API calls
};
```

## 📁 Output Structure

Generated MDX files include:

```mdx
---
title: "Best Gaming Headsets 2025"
description: "Top gaming headsets ranked by performance..."
slug: "best-gaming-headsets-2025"
pubDate: 2025-07-23
tags: ["gaming", "headsets", "audio"]
image: "/images/best-gaming-headsets-2025-hero.webp"
---

import TierList from '../../components/TierList.astro'

# Best Gaming Headsets 2025

<TierList
  category="gaming"
  tiers={{
    S: {
      label: "Top Picks",
      products: [...]
    }
  }}
/>
```

## 🔗 Integration with TrendTiers

### Enhanced Image Fallback
Generated tierlists work seamlessly with the enhanced TierListCard image fallback logic:

1. **Frontmatter image**: `/images/${slug}-hero.webp`
2. **Product images**: Sourced from SerpAPI shopping results
3. **Fallback**: Placeholder SVG for missing images

### Homepage Integration
New tierlists automatically appear on the homepage with:
- ✅ Enhanced TierListCard component
- ✅ Responsive grid layout
- ✅ Proper routing and slug handling
- ✅ Amazon affiliate links

## 🛠️ Customization

### Adding New Categories
```javascript
CONFIG.trendingCategories.push('best smart home devices 2025');
```

### Adjusting Product Count
```javascript
CONFIG.maxProducts = 12; // Research more products
```

### Custom Tier Labels
```javascript
// In generateMDXContent function
const tierLabels = {
  S: 'Premium Picks',
  A: 'Great Value',
  B: 'Budget Options'
};
```

## 🐛 Error Handling

The script includes comprehensive error handling:
- ✅ API key validation
- ✅ Rate limiting and retry logic
- ✅ Graceful fallbacks for missing data
- ✅ Detailed logging at each step

## 📈 Scaling

### Batch Generation
```javascript
// Generate multiple tierlists
for (let i = 0; i < 5; i++) {
  await generateTierlist();
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30s delay
}
```

### GitHub Actions Integration
```yaml
# .github/workflows/generate-tierlists.yml
name: Generate Tierlists
on:
  schedule:
    - cron: '0 9 * * 1' # Weekly on Mondays
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Generate Tierlist
        run: node scripts/generate-tierlist.mjs
```

## 🎉 Success Metrics

After running the script successfully:
- 📄 New MDX file created in `/src/content/tierlists/`
- 🔗 Accessible at `http://localhost:4321/${slug}`
- 🏠 Appears on homepage with enhanced TierListCard
- 📊 Includes 6-8 researched products with reviews
- 🎯 SEO-optimized with proper metadata and schema

This automation dramatically reduces the time to create high-quality affiliate content while maintaining the professional standards of TrendTiers.com!
