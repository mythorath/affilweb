/**
 * Amazon Affiliate Link Utilities
 * 
 * Functions for generating and managing Amazon affiliate links
 * with the mythorath-20 tracking ID.
 */

import * as cheerio from 'cheerio';

/**
 * Converts a raw Amazon product URL or ASIN to an affiliate link
 * @param {string} urlOrASIN - Either a full Amazon URL or just an ASIN
 * @returns {string} Amazon affiliate link with mythorath-20 tag
 * 
 * @example
 * // With ASIN
 * getAmazonAffiliateLink('B08N5WRWNW') 
 * // Returns: 'https://www.amazon.com/dp/B08N5WRWNW/?tag=mythorath-20'
 * 
 * // With full URL
 * getAmazonAffiliateLink('https://www.amazon.com/Herman-Miller-Aeron-Chair-Size/dp/B003M2B8EE/')
 * // Returns: 'https://www.amazon.com/dp/B003M2B8EE/?tag=mythorath-20'
 */
export function getAmazonAffiliateLink(urlOrASIN) {
  // If it's already an ASIN (10 characters, alphanumeric), use it directly
  if (urlOrASIN.length === 10 && /^[A-Z0-9]{10}$/.test(urlOrASIN)) {
    return `https://www.amazon.com/dp/${urlOrASIN}/?tag=mythorath-20`;
  }
  
  // Extract ASIN from Amazon URL
  if (urlOrASIN.includes('amazon')) {
    const asinMatch = urlOrASIN.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
    if (asinMatch && asinMatch[1]) {
      const asin = asinMatch[1];
      return `https://www.amazon.com/dp/${asin}/?tag=mythorath-20`;
    }
  }
  
  // If we can't extract an ASIN, throw an error
  throw new Error(`Invalid Amazon URL or ASIN: ${urlOrASIN}`);
}

/**
 * Checks if a URL is already an Amazon affiliate link with our tag
 * @param {string} url - URL to check
 * @returns {boolean} True if already has mythorath-20 tag
 */
export function isOurAffiliateLink(url) {
  return url.includes('tag=mythorath-20');
}

/**
 * Extracts ASIN from any Amazon URL format
 * @param {string} url - Amazon URL
 * @returns {string|null} ASIN if found, null otherwise
 */
export function extractASIN(url) {
  if (!url.includes('amazon')) return null;
  
  const asinMatch = url.match(/\/([A-Z0-9]{10})(?:[/?]|$)/);
  return asinMatch ? asinMatch[1] : null;
}

/**
 * Generates a short Amazon affiliate link (amzn.to format)
 * Note: This creates the format, but amzn.to links need to be created
 * through Amazon's link shortener service
 * @param {string} asin - Product ASIN
 * @returns {string} Short link format
 */
export function getShortAffiliateLink(asin) {
  // This is the format for short links, but they need to be registered with Amazon
  return `https://amzn.to/${asin}?tag=mythorath-20`;
}

/**
 * Attempts to fetch a full-resolution Amazon product image URL for the given ASIN
 * 
 * This function tries multiple common Amazon CDN image URL patterns to find
 * a valid product image. Amazon uses various formats and the availability
 * depends on the product and region.
 * 
 * @param {string} asin - The Amazon Standard Identification Number (10 characters)
 * @returns {Promise<string|null>} Full-resolution image URL or null if not found
 * 
 * @example
 * const imageUrl = await fetchAmazonImage('B08N5WRWNW');
 * if (imageUrl) {
 *   console.log('Image found:', imageUrl);
 * } else {
 *   console.log('No image available for this ASIN');
 * }
 */
export async function fetchAmazonImage(asin) {
  // Validate ASIN format
  if (!asin || typeof asin !== 'string' || !/^[A-Z0-9]{10}$/.test(asin)) {
    console.warn(`Invalid ASIN format: ${asin}`);
    return null;
  }

  // Common Amazon image URL patterns to try
  const imagePatterns = [
    // Primary Amazon CDN patterns
    `https://m.media-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    `https://images-eu.ssl-images-amazon.com/images/I/${asin}._AC_SL1500_.jpg`,
    
    // Alternative resolutions and formats
    `https://m.media-amazon.com/images/I/${asin}._AC_SL1000_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL1000_.jpg`,
    
    // Fallback smaller resolutions
    `https://m.media-amazon.com/images/I/${asin}._AC_SL500_.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}._AC_SL500_.jpg`,
    
    // Alternative format patterns (some products use different naming)
    `https://m.media-amazon.com/images/I/${asin}.jpg`,
    `https://images-na.ssl-images-amazon.com/images/I/${asin}.jpg`,
  ];

  // Try each pattern until we find a working image
  for (const imageUrl of imagePatterns) {
    try {
      const response = await fetch(imageUrl, {
        method: 'HEAD', // Only check if the image exists, don't download it
        timeout: 5000,  // 5 second timeout
      });
      
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        console.log(`✅ Found Amazon image for ASIN ${asin}: ${imageUrl}`);
        return imageUrl;
      }
    } catch (error) {
      // Log the error and continue to next pattern
      console.debug(`Image URL failed: ${imageUrl} - ${error.message}`);
    }
  }

  // If no direct CDN images work, try scraping the product page
  try {
    const scrapedImage = await scrapeAmazonProductImage(asin);
    if (scrapedImage) {
      return scrapedImage;
    }
  } catch (error) {
    console.warn(`Failed to scrape image for ASIN ${asin}:`, error.message);
  }

  // Last resort: Try fallback image search if we have a product name
  // This would require the product name to be passed or derived from ASIN
  console.log(`🔄 Attempting fallback image search for ASIN: ${asin}`);
  try {
    // Try to get product name from Amazon first, then search for images
    const productName = await getProductNameFromASIN(asin);
    if (productName) {
      const fallbackImage = await fetchProductImageFallback(productName);
      if (fallbackImage) {
        return fallbackImage;
      }
    }
  } catch (error) {
    console.warn(`Fallback image search failed for ASIN ${asin}:`, error.message);
  }

  console.warn(`❌ No image found for ASIN: ${asin}`);
  return null;
}

/**
 * Attempts to scrape the main product image from an Amazon product page
 * @private
 * @param {string} asin - Product ASIN
 * @returns {Promise<string|null>} Image URL or null if not found
 */
async function scrapeAmazonProductImage(asin) {
  try {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    
    console.log(`🔍 Scraping Amazon product page for ASIN: ${asin}`);
    
    // Fetch the product page with browser-like headers
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 15000, // 15 second timeout for full page load
    });

    if (!response.ok) {
      console.warn(`Failed to fetch Amazon page for ${asin}: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Strategy 1: Look for the main landing image
    const landingImage = $('#landingImage').attr('src');
    if (landingImage && landingImage.startsWith('https://')) {
      console.log(`✅ Found landing image for ASIN ${asin}: ${landingImage}`);
      return landingImage;
    }

    // Strategy 2: Look for images with data-a-dynamic-image attribute
    let largestImageUrl = null;
    let largestImageSize = 0;

    $('img[data-a-dynamic-image]').each((index, element) => {
      const dynamicImageData = $(element).attr('data-a-dynamic-image');
      if (dynamicImageData) {
        try {
          // Parse the JSON data which contains image URLs and their dimensions
          const imageData = JSON.parse(dynamicImageData);
          
          // Find the image with the largest dimensions
          for (const [imageUrl, dimensions] of Object.entries(imageData)) {
            if (Array.isArray(dimensions) && dimensions.length >= 2) {
              const width = dimensions[0];
              const height = dimensions[1];
              const imageSize = width * height;
              
              if (imageSize > largestImageSize && imageUrl.startsWith('https://')) {
                largestImageSize = imageSize;
                largestImageUrl = imageUrl;
              }
            }
          }
        } catch (parseError) {
          console.debug(`Failed to parse dynamic image data: ${parseError.message}`);
        }
      }
    });

    if (largestImageUrl) {
      console.log(`✅ Found dynamic image for ASIN ${asin}: ${largestImageUrl} (${largestImageSize}px)`);
      return largestImageUrl;
    }

    // Strategy 3: Look for any high-resolution images in the page
    const imageSelectors = [
      'img[data-old-hires]',
      'img[src*="._AC_SL1500_"]',
      'img[src*="._AC_SL1000_"]',
      'img[src*="images-na.ssl-images-amazon.com"]',
      'img[src*="m.media-amazon.com"]'
    ];

    for (const selector of imageSelectors) {
      const $img = $(selector).first();
      if ($img.length) {
        const imageUrl = $img.attr('src') || $img.attr('data-old-hires');
        if (imageUrl && imageUrl.startsWith('https://') && imageUrl.includes('amazon')) {
          console.log(`✅ Found fallback image for ASIN ${asin}: ${imageUrl}`);
          return imageUrl;
        }
      }
    }

    // Strategy 4: Regex fallback for JSON-embedded image URLs
    const regexPatterns = [
      /"hiRes":"([^"]+)"/,
      /"large":"([^"]+)"/,
      /"main":{"[^"]*":"([^"]+)"/,
    ];

    for (const pattern of regexPatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        let imageUrl = match[1];
        
        // Decode any escaped characters
        imageUrl = imageUrl.replace(/\\u[\dA-F]{4}/gi, (match) => {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
        
        // Decode other escape sequences
        imageUrl = imageUrl.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        
        if (imageUrl.startsWith('https://') && imageUrl.includes('amazon')) {
          console.log(`✅ Found regex image for ASIN ${asin}: ${imageUrl}`);
          return imageUrl;
        }
      }
    }

    console.warn(`❌ No suitable image found in Amazon page for ASIN: ${asin}`);
    return null;

  } catch (error) {
    console.warn(`Scraping failed for ASIN ${asin}:`, error.message);
    return null;
  }
}

/**
 * Batch fetch images for multiple ASINs with rate limiting
 * @param {string[]} asins - Array of ASINs to fetch images for
 * @param {number} delay - Delay between requests in milliseconds (default: 1000)
 * @returns {Promise<Object>} Object mapping ASINs to image URLs (or null)
 * 
 * @example
 * const images = await fetchAmazonImagesBatch(['B08N5WRWNW', 'B003M2B8EE']);
 * console.log(images); // { 'B08N5WRWNW': 'https://...', 'B003M2B8EE': null }
 */
export async function fetchAmazonImagesBatch(asins, delay = 1000) {
  const results = {};
  
  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    console.log(`🔍 Fetching image ${i + 1}/${asins.length} for ASIN: ${asin}`);
    
    try {
      results[asin] = await fetchAmazonImage(asin);
    } catch (error) {
      console.error(`Error fetching image for ASIN ${asin}:`, error.message);
      results[asin] = null;
    }
    
    // Add delay between requests to be respectful to Amazon's servers
    if (i < asins.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return results;
}

/**
 * Fetches a product image using DuckDuckGo Instant Answer API as a fallback
 * @param {string} productName - The product name to search for
 * @returns {Promise<string|null>} Image URL or null if not found
 * 
 * @example
 * const imageUrl = await fetchProductImageFallback('Steelcase Leap V2 Chair');
 * if (imageUrl) {
 *   console.log('Found fallback image:', imageUrl);
 * }
 */
export async function fetchProductImageFallback(productName) {
  if (!productName || typeof productName !== 'string') {
    console.warn('Invalid product name provided for fallback image search');
    return null;
  }

  console.log(`🔍 Searching for fallback image: "${productName}"`);

  try {
    // Try DuckDuckGo Instant Answer API first
    const ddgImage = await searchDuckDuckGoImage(productName);
    if (ddgImage) {
      return ddgImage;
    }

    // Try alternative image search APIs
    const alternativeImage = await searchAlternativeImageAPI(productName);
    if (alternativeImage) {
      return alternativeImage;
    }

    console.log(`❌ No fallback image found for: "${productName}"`);
    return null;

  } catch (error) {
    console.warn(`Fallback image search failed for "${productName}":`, error.message);
    return null;
  }
}

/**
 * Search for product images using DuckDuckGo Instant Answer API
 * @private
 * @param {string} productName - Product name to search
 * @returns {Promise<string|null>} Image URL or null
 */
async function searchDuckDuckGoImage(productName) {
  try {
    // DuckDuckGo Instant Answer API
    const query = encodeURIComponent(`${productName} product`);
    const ddgUrl = `https://api.duckduckgo.com/?q=${query}&format=json&no_html=1&skip_disambig=1`;
    
    console.log(`🦆 Trying DuckDuckGo API for: "${productName}"`);
    
    const response = await fetch(ddgUrl, {
      headers: {
        'User-Agent': 'TrendTiers.com Image Fetcher 1.0',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      console.debug(`DuckDuckGo API returned: ${response.status}`);
      return null;
    }

    const data = await response.json();
    
    // Check for instant answer image
    if (data.Image && data.Image.startsWith('https://')) {
      console.log(`✅ Found DuckDuckGo instant answer image: ${data.Image}`);
      return data.Image;
    }

    // Check for related topics with images
    if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics) {
        if (topic.Icon && topic.Icon.URL && topic.Icon.URL.startsWith('https://')) {
          // Filter out generic icons
          if (!topic.Icon.URL.includes('duckduckgo.com') && 
              !topic.Icon.URL.includes('icon') && 
              topic.Icon.Width > 50) {
            console.log(`✅ Found DuckDuckGo related topic image: ${topic.Icon.URL}`);
            return topic.Icon.URL;
          }
        }
      }
    }

    return null;
  } catch (error) {
    console.debug(`DuckDuckGo search failed: ${error.message}`);
    return null;
  }
}

/**
 * Search for product images using alternative APIs
 * @private
 * @param {string} productName - Product name to search
 * @returns {Promise<string|null>} Image URL or null
 */
async function searchAlternativeImageAPI(productName) {
  try {
    // Try Unsplash API for product-related images (requires API key but has free tier)
    const unsplashImage = await searchUnsplashImage(productName);
    if (unsplashImage) {
      return unsplashImage;
    }

    // Try Wikipedia/Wikidata API for product images
    const wikipediaImage = await searchWikipediaImage(productName);
    if (wikipediaImage) {
      return wikipediaImage;
    }

    return null;
  } catch (error) {
    console.debug(`Alternative image search failed: ${error.message}`);
    return null;
  }
}

/**
 * Search Unsplash for product-related images
 * @private
 * @param {string} productName - Product name to search
 * @returns {Promise<string|null>} Image URL or null
 */
async function searchUnsplashImage(productName) {
  try {
    // Extract key terms for better search results
    const searchTerms = productName
      .toLowerCase()
      .replace(/\b(chair|mouse|keyboard|headset|laptop)\b/g, '$1')
      .split(' ')
      .filter(term => term.length > 2)
      .slice(0, 3) // Use first 3 relevant terms
      .join(' ');

    const query = encodeURIComponent(searchTerms);
    
    // Note: This would require an Unsplash API key in production
    // For now, we'll use their public search endpoint (limited)
    const unsplashUrl = `https://unsplash.com/napi/search/photos?query=${query}&per_page=1`;
    
    console.log(`📸 Trying Unsplash search for: "${searchTerms}"`);
    
    const response = await fetch(unsplashUrl, {
      headers: {
        'User-Agent': 'TrendTiers.com Image Fetcher 1.0',
      },
      timeout: 8000,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      const image = data.results[0];
      if (image.urls && image.urls.regular) {
        console.log(`✅ Found Unsplash image: ${image.urls.regular}`);
        return image.urls.regular;
      }
    }

    return null;
  } catch (error) {
    console.debug(`Unsplash search failed: ${error.message}`);
    return null;
  }
}

/**
 * Search Wikipedia for product images
 * @private
 * @param {string} productName - Product name to search
 * @returns {Promise<string|null>} Image URL or null
 */
async function searchWikipediaImage(productName) {
  try {
    const query = encodeURIComponent(productName);
    const wikipediaUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${query}`;
    
    console.log(`📖 Trying Wikipedia search for: "${productName}"`);
    
    const response = await fetch(wikipediaUrl, {
      headers: {
        'User-Agent': 'TrendTiers.com Image Fetcher 1.0',
      },
      timeout: 8000,
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.originalimage && data.originalimage.source) {
      console.log(`✅ Found Wikipedia image: ${data.originalimage.source}`);
      return data.originalimage.source;
    }

    return null;
  } catch (error) {
    console.debug(`Wikipedia search failed: ${error.message}`);
    return null;
  }
}

/**
 * Attempts to get product name from ASIN by scraping Amazon page
 * @private
 * @param {string} asin - Product ASIN
 * @returns {Promise<string|null>} Product name or null
 */
async function getProductNameFromASIN(asin) {
  try {
    const productUrl = `https://www.amazon.com/dp/${asin}`;
    
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      console.debug(`Failed to fetch Amazon page for ${asin}: ${response.status} ${response.statusText}`);
      return getBestGuessProductName(asin);
    }

    const html = await response.text();
    
    // Try to extract product title from Amazon page
    const $ = cheerio.load(html);
    
    // Common selectors for product titles
    const titleSelectors = [
      '#productTitle',
      '[data-testid="product-title"]',
      '.product-title',
      'h1 span',
      'h1.a-color-base'
    ];

    for (const selector of titleSelectors) {
      const title = $(selector).first().text().trim();
      if (title && title.length > 5) {
        console.log(`📝 Extracted product name: "${title}"`);
        return title;
      }
    }

    // Fallback: regex search for title patterns
    const titlePatterns = [
      /<title[^>]*>([^<]+)/i,
      /"productTitle":"([^"]+)"/i,
      /"title":"([^"]+)"/i,
    ];

    for (const pattern of titlePatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 5) {
        const title = match[1]
          .replace(/Amazon\.com\s*:\s*/i, '')
          .replace(/\s*-\s*Amazon\.com$/i, '')
          .trim();
        
        if (title.length > 5 && !title.toLowerCase().includes('amazon')) {
          console.log(`📝 Regex extracted product name: "${title}"`);
          return title;
        }
      }
    }

    // If we got here, Amazon blocked us or no title found
    return getBestGuessProductName(asin);
  } catch (error) {
    console.debug(`Failed to extract product name for ASIN ${asin}:`, error.message);
    return getBestGuessProductName(asin);
  }
}

/**
 * Generate a best-guess product category based on ASIN patterns
 * This helps with fallback image search when we can't scrape the actual product name
 * @private
 * @param {string} asin - Product ASIN
 * @returns {string} Generic product category for search
 */
function getBestGuessProductName(asin) {
  // Amazon ASINs often have patterns that correlate with product categories
  const categoryGuesses = {
    'B08': 'electronics headphones',
    'B07': 'electronics wireless device', 
    'B06': 'home office product',
    'B05': 'book magazine',
    'B04': 'computer accessories',
    'B03': 'office chair furniture',
    'B02': 'clothing fashion',
    'B01': 'tools hardware',
    'B00': 'popular product'
  };
  
  const prefix = asin.substring(0, 3);
  const guess = categoryGuesses[prefix] || 'consumer product';
  
  console.log(`📝 Best-guess product category: "${guess}" (based on ASIN ${asin})`);
  return guess;
}
