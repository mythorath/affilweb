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
