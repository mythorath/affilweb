# Amazon Image Utilities Documentation

## Overview

This document describes the Amazon image fetching utilities for TrendTiers.com, providing automated image retrieval for Amazon products used in tierlists.

## Core Functions

### `fetchAmazonImage(asin)`

The main function for retrieving product images. Implements a multi-stage fallback strategy:

1. **Amazon CDN Pattern Matching** - Fast URL construction using known patterns
2. **HTML Scraping** - Scrapes Amazon product pages to extract image URLs  
3. **Fallback Image Search** - Uses external APIs when Amazon access fails

```javascript
import { fetchAmazonImage } from '../src/utils/amazon.js';

const imageUrl = await fetchAmazonImage('B08N5WRWNW');
console.log(imageUrl); // Returns image URL or null
```

### `fetchProductImageFallback(productName)`

Searches for product images using external services when Amazon images are unavailable:

- **DuckDuckGo Instant Answer API** - First fallback option
- **Unsplash API** - High-quality stock photography 
- **Wikipedia API** - For well-known products and brands

```javascript
import { fetchProductImageFallback } from '../src/utils/amazon.js';

const imageUrl = await fetchProductImageFallback('Sony WH-1000XM4 Headphones');
```

## Integration Strategy

### Multi-Tier Fallback Approach

1. **CDN Patterns**: Try known Amazon image URL patterns (fastest)
2. **Scraping**: Parse Amazon product pages for image elements
3. **External Search**: Use DuckDuckGo, Unsplash, Wikipedia APIs
4. **Smart Categorization**: Generate relevant search terms from ASINs

### Bot-Blocking Mitigation

Amazon actively blocks automated requests. Our approach:

- **Realistic Headers**: Mimic browser requests with proper User-Agent
- **Graceful Degradation**: Fall back to external sources when blocked
- **Smart Search Terms**: Generate relevant categories from ASIN patterns
- **Rate Limiting**: Respectful delays between requests

## Usage Examples

### Adding Images to Existing Tierlists

```bash
# Add images to all tierlists
node scripts/addAmazonImages.mjs

# Test image fetching
node scripts/test-amazon-images.mjs

# Debug scraping issues
node scripts/debug-amazon-scraping.mjs

# Test fallback functionality
node scripts/test-fallback-images.mjs
```

### Manual Image Fetching

```javascript
import { fetchAmazonImage, extractASIN } from '../src/utils/amazon.js';

// From Amazon URL
const asin = extractASIN('https://www.amazon.com/dp/B08N5WRWNW');
const imageUrl = await fetchAmazonImage(asin);

// Direct ASIN
const imageUrl2 = await fetchAmazonImage('B08N5WRWNW');
```

## Testing Scripts

### `test-amazon-images.mjs`
Tests basic Amazon image fetching with CDN patterns and scraping.

### `test-fallback-images.mjs`  
Tests external API fallback functionality with known product names.

### `debug-amazon-scraping.mjs`
Debugs Amazon scraping issues and bot-blocking detection.

### `addAmazonImages.mjs`
Batch utility to add images to all tierlist JSON files.

## API Configuration

### Unsplash API
Uses the public Unsplash Source API for high-quality product photography:
- Base URL: `https://source.unsplash.com/1080x1080/?{query}`
- No API key required for basic usage
- Returns direct image URLs

### DuckDuckGo API
Uses the Instant Answer API for product information:
- Base URL: `https://api.duckduckgo.com/?q={query}&format=json`
- No API key required
- Extracts images from InstantAnswer results

### Wikipedia API
Searches Wikipedia for product and brand images:
- Base URL: `https://en.wikipedia.org/api/rest_v1/page/summary/{query}`
- No API key required
- Extracts thumbnail images from page summaries

## Error Handling

### Common Issues

1. **404 Errors**: ASIN not found or product delisted
2. **Bot Blocking**: Amazon returns CAPTCHA or access denied
3. **Rate Limiting**: Too many requests in short timeframe
4. **Network Timeouts**: Slow or failed API responses

### Logging and Debugging

The utilities provide comprehensive logging:

```javascript
// Enable debug logging
console.log('🔍 Searching for Amazon image...');
console.log('❌ Amazon blocked request, trying fallback...');
console.log('✅ Found fallback image from Unsplash');
```

## Product Object Integration

### Schema Update

The product object now supports an optional `image` field:

```javascript
{
  "name": "Sony WH-1000XM4 Headphones",
  "amazonUrl": "https://www.amazon.com/dp/B08N5WRWNW",
  "image": "https://images-na.ssl-images-amazon.com/images/I/61K8bqVz2OL._AC_SL1500_.jpg", // Optional
  "price": "$348.00",
  "rating": 4.5
}
```

### Validation

Updated Zod schema allows optional image strings:

```javascript
const productSchema = z.object({
  name: z.string(),
  amazonUrl: z.string().url(),
  image: z.string().url().optional(), // ✅ Now supported
  price: z.string(),
  rating: z.number()
});
```

## Performance Considerations

### Caching Strategy

Consider implementing caching for:
- Successfully fetched Amazon images
- External API responses  
- Failed ASIN lookups to avoid retries

### Rate Limiting

Recommended delays:
- Amazon requests: 2-3 seconds between calls
- External APIs: 1 second between calls
- Batch operations: Process in chunks of 5-10 items

## Troubleshooting

### Amazon Scraping Fails

1. Check if ASIN exists: Try the URL manually
2. Verify bot detection: Look for CAPTCHA in response
3. Test fallback: Ensure external APIs are working
4. Update User-Agent: Amazon may block outdated browser strings

### External APIs Fail

1. **DuckDuckGo**: Check API endpoint accessibility
2. **Unsplash**: Verify query format and special characters
3. **Wikipedia**: Ensure proper URL encoding for searches

### No Images Found

1. **Generic Search Terms**: ASIN-based categories may be too broad
2. **Product Name Extraction**: Amazon blocking may prevent name lookup
3. **API Limitations**: Some products may not have public images

## Future Enhancements

### Potential Improvements

1. **API Keys**: Add support for premium image APIs (SerpAPI, Bing Image Search)
2. **Machine Learning**: Use image recognition to verify product relevance
3. **Caching Layer**: Implement Redis/database caching for images
4. **Proxy Support**: Rotate IP addresses to avoid bot detection
5. **Product Database**: Build local product name -> ASIN mapping

### Monitoring

Consider adding:
- Success/failure rate tracking
- Response time monitoring  
- Bot detection alerts
- API quota usage tracking

## Related Files

- `src/utils/amazon.js` - Main utility functions
- `src/components/TierList.astro` - Component that displays images
- `scripts/generateTierlist.mjs` - Generation script with image validation
- `scripts/addAmazonImages.mjs` - Batch image addition utility
