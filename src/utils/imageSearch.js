/**
 * Image Search Utilities using SerpAPI
 * 
 * Functions for fetching product images from search engines using SerpAPI
 * when Amazon images are not available.
 */

/**
 * Fetches product images using SerpAPI Google Images search
 * @param {string} query - Product name or search query
 * @returns {Promise<{url: string|null, source: string}>} Image URL and source type
 * 
 * @example
 * const result = await fetchImageFromSerpAPI('Steelcase Leap V2 Office Chair');
 * if (result.url) {
 *   console.log('Found image:', result.url, 'from', result.source);
 * }
 */
export async function fetchImageFromSerpAPI(query) {
  if (!query || typeof query !== 'string') {
    console.warn('Invalid query provided for SerpAPI image search');
    return { url: null, source: 'error' };
  }

  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn('SERPAPI_KEY not found in environment variables');
    return { url: null, source: 'error' };
  }

  console.log(`🔍 [SerpAPI] Searching for product image: "${query}"`);

  try {
    // SerpAPI Google Images endpoint
    const searchParams = new URLSearchParams({
      engine: 'google_images',
      q: `${query} product`,
      api_key: apiKey,
      tbm: 'isch', // Image search
      safe: 'active',
      num: 20, // Get more results to filter through
      ijn: '0' // First page of results
    });

    const serpApiUrl = `https://serpapi.com/search?${searchParams.toString()}`;
    
    console.log(`🔍 [SerpAPI] Making request to SerpAPI...`);
    
    const response = await fetch(serpApiUrl, {
      headers: {
        'User-Agent': 'TrendTiers.com Image Fetcher 1.0',
      },
      timeout: 15000, // 15 second timeout
    });

    if (!response.ok) {
      console.warn(`❌ [SerpAPI] Request failed: ${response.status} ${response.statusText}`);
      return { url: null, source: 'serpapi_error' };
    }

    const data = await response.json();
    
    // Check for API errors
    if (data.error) {
      console.warn(`❌ [SerpAPI] API error: ${data.error}`);
      return { url: null, source: 'serpapi_error' };
    }

    if (!data.images_results || !Array.isArray(data.images_results)) {
      console.warn(`❌ [SerpAPI] No image results found for: "${query}"`);
      return { url: null, source: 'none' };
    }

    console.log(`📊 [SerpAPI] Found ${data.images_results.length} image results`);

    // Preferred retail domains for product images
    const preferredDomains = [
      'amazon.com', 'amazon.co.uk', 'bestbuy.com', 'newegg.com',
      'logitech.com', 'corsair.com', 'razer.com', 'steelseries.com',
      'hyperx.com', 'asus.com', 'msi.com', 'sony.com', 'apple.com',
      'walmart.com', 'target.com', 'microcenter.com', 'officedepot.com',
      'staples.com', 'costco.com', 'samsclub.com', 'bhphotovideo.com'
    ];

    // First pass: Look for images from preferred retail domains
    for (const image of data.images_results) {
      if (image.original && image.source) {
        const imageUrl = image.original;
        const sourceUrl = image.source;
        
        // Check if image is from a preferred retail domain
        for (const domain of preferredDomains) {
          if (sourceUrl.includes(domain) || imageUrl.includes(domain)) {
            console.log(`✅ [SerpAPI] Found retail domain image from ${domain}: ${imageUrl}`);
            return { url: imageUrl, source: 'serpapi_retail' };
          }
        }
      }
    }

    // Second pass: Look for high-quality images (minimum dimensions)
    for (const image of data.images_results) {
      if (image.original && image.original_width && image.original_height) {
        const imageUrl = image.original;
        const width = parseInt(image.original_width);
        const height = parseInt(image.original_height);
        
        // Filter for high-quality images (at least 500x500 pixels)
        if (width >= 500 && height >= 500) {
          // Skip obviously low-quality domains
          const skipDomains = ['pinterest.com', 'ebay.com', 'aliexpress.com', 'temu.com'];
          const shouldSkip = skipDomains.some(domain => 
            imageUrl.includes(domain) || (image.source && image.source.includes(domain))
          );
          
          if (!shouldSkip) {
            console.log(`✅ [SerpAPI] Found high-quality image (${width}x${height}): ${imageUrl}`);
            return { url: imageUrl, source: 'serpapi_quality' };
          }
        }
      }
    }

    // Third pass: Take any decent image as fallback
    for (const image of data.images_results) {
      if (image.original) {
        const imageUrl = image.original;
        
        // Basic validation - must be a proper image URL
        if (imageUrl.match(/\.(jpg|jpeg|png|webp)(\?|$)/i)) {
          console.log(`✅ [SerpAPI] Found fallback image: ${imageUrl}`);
          return { url: imageUrl, source: 'serpapi_fallback' };
        }
      }
    }

    console.warn(`❌ [SerpAPI] No suitable images found for: "${query}"`);
    return { url: null, source: 'none' };

  } catch (error) {
    console.warn(`❌ [SerpAPI] Search failed for "${query}":`, error.message);
    return { url: null, source: 'error' };
  }
}

/**
 * Helper function to clean and optimize search queries for better results
 * @private
 * @param {string} productName - Raw product name
 * @returns {string} Optimized search query
 */
function optimizeSearchQuery(productName) {
  return productName
    // Remove common noise words that don't help image search
    .replace(/\b(the|a|an|for|with|and|or|best|top|review|reviews|2024|2025)\b/gi, '')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Fetches product images with enhanced query optimization
 * @param {string} productName - Product name to search for
 * @returns {Promise<{url: string|null, source: string}>} Image URL and source type
 */
export async function fetchProductImageOptimized(productName) {
  const optimizedQuery = optimizeSearchQuery(productName);
  console.log(`🔍 [SerpAPI] Optimized query: "${productName}" → "${optimizedQuery}"`);
  
  return await fetchImageFromSerpAPI(optimizedQuery);
}
