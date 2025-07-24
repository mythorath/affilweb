# Tierlist Generation Scripts

This directory contains scripts for generating MDX tierlist files for the TrendTiers.com website.

## Scripts Overview

### 1. `generate-tier.mjs` - AI-Powered Generation
Uses OpenAI GPT-4 to automatically generate complete tier lists from topic prompts.

**Usage:**
```bash
node scripts/generate-tier.mjs "best wireless mice 2025"
```

**Features:**
- AI-generated product recommendations
- Automatic tier assignments (S, A, B)
- SEO-optimized content
- Requires OpenAI API key

### 2. `generateTierlist.mjs` - JSON-Based Generation
Creates tier lists from structured JSON data for precise control over content.

**Usage:**
```bash
node scripts/generateTierlist.mjs path/to/data.json
```

**Features:**
- Full control over products and tiers
- Custom intro text support
- Structured data input
- No API required

## JSON Data Format

For `generateTierlist.mjs`, use this JSON structure:

```json
{
  "title": "Best Wireless Earbuds 2025",
  "description": "SEO meta description for the page",
  "pubDate": "2025-07-23",
  "image": "/images/wireless-earbuds.jpg",
  "tags": ["audio", "earbuds", "wireless", "reviews", "2025"],
  "introText": "Optional custom intro paragraph...",
  "tiers": {
    "S": [
      {
        "name": "Product Name",
        "review": "Detailed review explaining why it's in this tier",
        "link": "https://amzn.to/affiliate-link",
        "image": "https://example.com/product-image.jpg"
      }
    ],
    "A": [
      {
        "name": "Another Product",
        "review": "Review text for this product",
        "link": "https://amzn.to/another-link",
        "image": "https://example.com/another-image.jpg"
      }
    ],
    "B": [...]
  }
}
```

## Required Fields

- **title**: Page title and H1
- **description**: SEO meta description
- **pubDate**: Publication date (YYYY-MM-DD format)
- **image**: Featured image path
- **tags**: Array of content tags
- **tiers**: Object with tier names as keys and product arrays as values

Each product must have:
- **name**: Product name
- **review**: Short review/description
- **link**: Affiliate link URL

Each product may optionally have:
- **image**: Product image URL (displays as thumbnail in the tier list)

## Optional Fields

- **introText**: Custom introduction paragraph (uses description if not provided)

## Output

Both scripts generate MDX files in `/src/content/tierlists/` with:
- Auto-generated kebab-case filenames
- Proper frontmatter
- TierList component integration
- Additional content sections

## Examples

See `scripts/example-tierlist.json` for a complete example.

## Tips

1. Use consistent tier naming (S, A, B, C)
2. Keep reviews concise but informative (30-50 words)
3. Ensure all affiliate links are properly formatted
4. Use descriptive, SEO-friendly titles
5. Include relevant tags for better categorization
