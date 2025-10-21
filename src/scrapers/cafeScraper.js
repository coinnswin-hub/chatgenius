import axios from 'axios';
import * as cheerio from 'cheerio';
import logger from '../utils/logger.js';
import config from '../utils/config.js';

class CafeScraper {
  constructor() {
    this.baseUrl = config.cafe.websiteUrl;
  }

  /**
   * Scrape menu data from all Cafe locations
   */
  async scrapeAllLocations() {
    logger.info('Starting to scrape all Cafe locations...');
    const allMenuData = [];

    try {
      for (const location of config.locations) {
        try {
          const menuData = await this.scrapeLocation(location);
          allMenuData.push(menuData);
          
          // Add a small delay between requests to be respectful
          await this.sleep(1000);
        } catch (error) {
          logger.error(`Failed to scrape ${location.name}:`, error.message);
          // Continue with other locations even if one fails
          allMenuData.push({
            id: location.id,
            name: location.name,
            error: error.message,
            products: {},
          });
        }
      }

      logger.info(`Successfully scraped ${allMenuData.length} locations`);
      return allMenuData;
    } catch (error) {
      logger.error('Failed to scrape locations:', error);
      throw error;
    }
  }

  /**
   * Scrape menu data for a specific location
   */
  async scrapeLocation(location) {
    logger.info(`Scraping ${location.name}...`);
    
    try {
      const url = this.baseUrl + location.url;
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const $ = cheerio.load(response.data);
      const products = this.parseProducts($);

      return {
        id: location.id,
        name: location.name,
        url: url,
        products: products,
        scrapedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error(`Error scraping ${location.name}:`, error.message);
      throw error;
    }
  }

  /**
   * Parse products from HTML
   * Note: This is a generic parser. It will need to be customized based on actual website structure.
   */
  parseProducts($) {
    const productsByCategory = {};

    try {
      // Initialize categories
      config.categories.forEach((category) => {
        productsByCategory[category] = [];
      });

      // Generic product parsing - adapt based on actual website structure
      // This is a placeholder implementation
      $('.product-item, .menu-item, [class*="product"]').each((i, element) => {
        try {
          const $element = $(element);
          const name = $element.find('.product-name, .item-name, h3, h4').first().text().trim();
          const price = $element.find('.price, .product-price, [class*="price"]').first().text().trim();
          const description = $element.find('.description, .product-description').first().text().trim();
          const category = this.detectCategory($element, name, description);
          
          if (name && category) {
            const product = {
              name: name,
              price: price || 'N/A',
              description: description || '',
            };

            // Extract additional attributes if available
            const thc = $element.find('[class*="thc"], .thc-content').text().trim();
            const cbd = $element.find('[class*="cbd"], .cbd-content').text().trim();
            
            if (thc) product.thc = thc;
            if (cbd) product.cbd = cbd;

            productsByCategory[category].push(product);
          }
        } catch (error) {
          logger.warn('Failed to parse individual product:', error.message);
        }
      });

      // If no products found with generic selectors, log the page structure
      const totalProducts = Object.values(productsByCategory).flat().length;
      if (totalProducts === 0) {
        logger.warn('No products found with current selectors. Website structure may have changed.');
        logger.debug('Page structure sample:', $('body').html().substring(0, 500));
      }

    } catch (error) {
      logger.error('Failed to parse products:', error);
    }

    return productsByCategory;
  }

  /**
   * Detect product category based on element, name, or description
   */
  detectCategory($element, name, description) {
    const text = `${name} ${description} ${$element.attr('class') || ''}`.toLowerCase();

    // Check for category keywords
    if (text.includes('flower') || text.includes('bud')) return 'flower';
    if (text.includes('pre-roll') || text.includes('preroll') || text.includes('joint')) return 'pre-rolls';
    if (text.includes('edible') || text.includes('gummy') || text.includes('chocolate')) return 'edibles';
    if (text.includes('concentrate') || text.includes('shatter') || text.includes('wax')) return 'concentrates';
    if (text.includes('vape') || text.includes('cartridge') || text.includes('pen')) return 'vapes';
    if (text.includes('beverage') || text.includes('drink') || text.includes('tea')) return 'beverages';
    if (text.includes('accessory') || text.includes('grinder') || text.includes('paper')) return 'accessories';

    // Default to flower if no category detected
    return 'flower';
  }

  /**
   * Sleep helper function
   */
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Test connection to Cafe website
   */
  async testConnection() {
    try {
      logger.info(`Testing connection to ${this.baseUrl}...`);
      const response = await axios.get(this.baseUrl, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });
      
      logger.info(`Connection successful! Status: ${response.status}`);
      return true;
    } catch (error) {
      logger.error(`Connection failed: ${error.message}`);
      return false;
    }
  }
}

export default new CafeScraper();
