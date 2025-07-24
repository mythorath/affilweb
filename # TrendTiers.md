# TrendTiers.com – Copilot Reference

## 📘 Purpose
TrendTiers.com is a fully static, SEO-optimized affiliate website that publishes tier list–style product recommendation articles. Each page is auto-generated using LLMs and features:
- Tiered rankings (S, A, B, etc.)
- Short reviews and justifications per product
- Affiliate links
- Stock images
- SEO metadata

## 🧱 Tech Stack
- Astro (static site generator)
- MDX content files (1 per tier list)
- Minimal JavaScript
- GitHub + Vercel for CI/CD
- GitHub Copilot for assisted development
- No backend or database

## 📁 Folder Structure

/src
/components → TierList and utility UI
/content/tierlists → AI-generated MDX articles
/pages → Home and dynamic routes
/layouts → Site layout
/scripts → Generation scripts (AI, scraping, etc.)
/public/images → Product images
/utils/affiliates.json → Master list of affiliate URLs


## 📄 MDX File Format (Tier List)
Each article lives at `/src/content/tierlists/{slug}.mdx` and uses:
```mdx
---
title: Best X in YYYY
description: SEO meta description
pubDate: 2025-07-23
slug: best-x-in-yyyy
image: /images/example.jpg
tags: [tag1, tag2]
---

import TierList from '../../components/TierList.astro'

<TierList
  tiers={{
    "S": [
      { 
        name: "Product A", 
        review: "Excellent for X", 
        link: "https://amzn.to/...",
        image: "https://images-na.ssl-images-amazon.com/images/I/product.jpg"
      }
    ],
    "A": [
      { 
        name: "Product B", 
        review: "Budget option", 
        link: "https://amzn.to/...",
        image: "https://m.media-amazon.com/images/I/product2.jpg"
      }
    ]
  }}
/>

💡 Components Overview
TierList.astro

Renders each tier (S, A, B...) as a section with the product's name, review, and affiliate link.
AffiliateButton.astro (optional)

Reusable button with cloaked or dynamic URL via utils/affiliates.json.
🌐 SEO

Every page should:

    Include Open Graph and Twitter metadata in <head>

    Inject JSON-LD using schema.org (type: ItemList)

    Have a canonical URL

🧠 Copilot Behavior

    Generate content-first components

    Use Astro props and Astro.glob/getCollection for dynamic content

    Avoid React/JSX unless explicitly used in components

    Assume each page is static and should render without JS

🛠 Planned Scripts

    generate-tier.js: Uses LLM API to generate an MDX tier list article

    find-trends.js: Crawls Reddit/Exploding Topics/Google Trends

    addAmazonImages.mjs: Automatically fetches Amazon product images by ASIN

    enhance-tierlists-with-images.mjs: Auto-enhances existing tierlists with missing product images using SerpAPI

    enhance-tierlists-with-reviews.mjs: Auto-enhances existing tierlists with AI-generated product reviews using OpenAI

    enhance-tierlists-with-affiliate-links.mjs: Auto-enhances existing tierlists with proper Amazon affiliate links using tracking ID

    GitHub Actions to run the above and deploy to Vercel

🖼️ Image Management

    Product images are automatically fetched from Amazon CDN when available

    Images are optional - tierlists work with or without product images

    Use utils/amazon.js functions to fetch images programmatically

    Images display as responsive thumbnails in tier lists


---

Once that’s added to the project root, send me a quick "📌 Reference added" and I’ll give you the first Copilot prompt in the correct order. I’ll wait for each diff before moving forward.

Ready?