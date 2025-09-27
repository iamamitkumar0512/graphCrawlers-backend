import { logger } from "./logger";

/**
 * Clean URL by removing tracking parameters and unnecessary query strings
 * @param url - The URL to clean
 * @returns Cleaned URL without tracking parameters
 */
export function cleanUrl(url: string): string {
  try {
    if (!url || typeof url !== "string") {
      return url;
    }

    const urlObj = new URL(url);

    // List of tracking parameters to remove
    const trackingParams = [
      "source",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "fbclid",
      "gclid",
      "ref",
      "referrer",
      "campaign",
      "medium",
      "content",
      "term",
      "_ga",
      "_gl",
      "mc_cid",
      "mc_eid",
      "msclkid",
      "yclid",
    ];

    // Remove tracking parameters
    trackingParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // For Medium URLs, remove all query parameters to get clean URL
    if (urlObj.hostname.includes("medium.com")) {
      urlObj.search = "";
    }

    return urlObj.toString();
  } catch (error) {
    logger.warn(`Failed to clean URL: ${url}`, error);
    return url; // Return original URL if parsing fails
  }
}

/**
 * Clean multiple URLs
 * @param urls - Array of URLs to clean
 * @returns Array of cleaned URLs
 */
export function cleanUrls(urls: string[]): string[] {
  return urls.map((url) => cleanUrl(url));
}
