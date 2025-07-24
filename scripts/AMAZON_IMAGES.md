# Amazon Image Fetching Utilities

## Overview

This module provides utilities for fetching Amazon product images by ASIN (Amazon Standard Identification Number). The functions attempt to find high-resolution product images using common Amazon CDN patterns and fallback scraping methods.

## Functions

### `fetchAmazonImage(asin)`

Attempts to fetch a full-resolution Amazon product image URL for the given ASIN.

**Parameters:**
- `asin` (string): The Amazon Standard Identification Number (10 characters)

**Returns:**
- `Promise<string|null>`: Full-resolution image URL or null if not found

**Example:**
```javascript
import { fetchAmazonImage } from '../src/utils/amazon.js';

const imageUrl = await fetchAmazonImage('B08N5WRWNW');
if (imageUrl) {
  console.log('Image found:', imageUrl);
} else {
  console.log('No image available for this ASIN');
}
```

### `fetchAmazonImagesBatch(asins, delay)`

Batch fetch images for multiple ASINs with rate limiting.

**Parameters:**
- `asins` (string[]): Array of ASINs to fetch images for
- `delay` (number, optional): Delay between requests in milliseconds (default: 1000)

**Returns:**
- `Promise<Object>`: Object mapping ASINs to image URLs (or null)

**Example:**
```javascript
const images = await fetchAmazonImagesBatch(['B08N5WRWNW', 'B003M2B8EE']);
console.log(images); // { 'B08N5WRWNW': 'https://...', 'B003M2B8EE': null }
```

## Image URL Patterns

The function tries multiple common Amazon CDN patterns:

1. **Primary CDN**: `https://m.media-amazon.com/images/I/{ASIN}._AC_SL1500_.jpg`
2. **Regional CDNs**: NA and EU SSL images domains
3. **Different resolutions**: 1500px, 1000px, 500px
4. **Fallback formats**: Basic `.jpg` without size modifiers

## Rate Limiting

To be respectful to Amazon's servers:
- Default 1-second delay between requests in batch operations
- Configurable delay timing
- HEAD requests only to check image existence
- Timeout protection (5-10 seconds)

## Error Handling

The functions handle various edge cases:
- Invalid ASIN format validation
- Network timeouts and failures
- HTTP error responses
- Content-Type validation
- Graceful fallback between patterns

## Limitations

1. **Amazon Bot Protection**: Amazon may block automated requests. Consider using:
   - Proxy services
   - Browser automation tools
   - Official Amazon APIs where available

2. **Image Availability**: Not all products have public images in these CDN patterns

3. **Rate Limits**: Amazon may impose rate limits on image requests

## Usage in Tierlist Generation

### Automatic Image Addition

Use the `addAmazonImages.mjs` script to automatically add images to existing tierlist JSON files:

```bash
# Add images to a single tierlist
node scripts/addAmazonImages.mjs best-office-chairs.json

# Dry run to see what would be done
node scripts/addAmazonImages.mjs best-headphones.json --dry-run

# Overwrite existing images with 2-second delays
node scripts/addAmazonImages.mjs *.json --overwrite --delay 2000
```

### Manual Integration

```javascript
import { fetchAmazonImage, extractASIN } from './src/utils/amazon.js';

// Extract ASIN from affiliate link and fetch image
const asin = extractASIN('https://amzn.to/product-link');
const imageUrl = await fetchAmazonImage(asin);

// Add to product object
const product = {
  name: "Product Name",
  review: "Review text",
  link: "https://amzn.to/affiliate-link",
  image: imageUrl || undefined // Only add if found
};
```

## Testing

Test the functionality with the provided test script:

```bash
node scripts/test-amazon-images.mjs
```

This will test:
- Individual ASIN image fetching
- Batch processing
- ASIN extraction from URLs
- Error handling with invalid ASINs

## Best Practices

1. **Cache Results**: Store successful image URLs to avoid repeated requests
2. **Respect Rate Limits**: Use appropriate delays between requests
3. **Handle Failures Gracefully**: Always provide fallbacks for missing images
4. **Monitor Usage**: Be aware of your request patterns to avoid being blocked
5. **Consider Alternatives**: For production use, consider official Amazon APIs or image services

## Legal Considerations

- Ensure compliance with Amazon's Terms of Service
- Respect robots.txt and rate limiting
- Consider using official Amazon Product Advertising API for commercial use
- Only use images in accordance with Amazon's content policies
