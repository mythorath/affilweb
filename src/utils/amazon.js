/**
 * Amazon Affiliate Link Utilities
 * 
 * Functions for generating and managing Amazon affiliate links
 * with the mythorath-20 tracking ID.
 */

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
    
    // Note: In a real implementation, you might want to use a proper web scraping
    // service or API to avoid being blocked by Amazon's anti-bot measures
    const response = await fetch(productUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      },
      timeout: 10000,
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    
    // Look for common image selectors in Amazon product pages
    const imagePatterns = [
      // Main product image
      /"hiRes":"([^"]+)"/,
      /"large":"([^"]+)"/,
      // Alternative image data
      /data-old-hires="([^"]+)"/,
      /data-a-dynamic-image="[^"]*"([^"]+)":\[/,
    ];

    for (const pattern of imagePatterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        const imageUrl = match[1].replace(/\\u[\dA-F]{4}/gi, (match) => {
          return String.fromCharCode(parseInt(match.replace(/\\u/g, ''), 16));
        });
        
        // Validate the extracted URL
        if (imageUrl.startsWith('https://') && imageUrl.includes('amazon')) {
          console.log(`✅ Scraped Amazon image for ASIN ${asin}: ${imageUrl}`);
          return imageUrl;
        }
      }
    }

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
