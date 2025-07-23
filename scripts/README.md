# Tier List Generator Scripts

This directory contains automation scripts for generating tier list content.

## Scripts

### generate-tier.mjs

A Node.js script that uses the OpenAI API to generate MDX tier list files.

**Usage:**
```bash
node scripts/generate-tier.mjs "best USB microphones 2025"
```

**Features:**
- Generates complete MDX files with frontmatter
- Creates SEO-optimized titles and descriptions
- Generates realistic product tiers (S, A, B)
- Includes affiliate links (placeholder format)
- Automatically creates slugs and tags
- Outputs to `/src/content/tierlists/`

**Requirements:**
- OpenAI API key in `.env` file
- Node.js dependencies: `openai`, `dotenv`

**Example Output:**
```
best-usb-microphones-2025.mdx
```

The script will generate a complete tier list article with:
- Structured frontmatter (title, description, date, slug, tags)
- TierList component with products and reviews
- Buying guide section
- FAQ section
