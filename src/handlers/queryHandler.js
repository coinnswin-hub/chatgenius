import logger from '../utils/logger.js';
import dataCache from '../utils/dataCache.js';
import messageParser from './messageParser.js';
import whatsapp from '../messaging/whatsapp.js';
import cafeScraper from '../scrapers/cafeScraper.js';

class QueryHandler {
  constructor() {
    this.isRefreshing = false;
  }

  /**
   * Handle incoming query and generate response
   */
  async handleQuery(parsedMessage) {
    try {
      const { intent, location, category } = parsedMessage;

      logger.info(`Handling query - Intent: ${intent}`);

      switch (intent) {
        case 'get_menu':
          return await this.handleMenuQuery(location);

        case 'list_products':
          return await this.handleProductListQuery(category, location);

        case 'refresh_menu':
          return await this.handleRefreshRequest();

        case 'last_update':
          return this.handleLastUpdateQuery();

        case 'help':
          return messageParser.getHelpMessage();

        case 'list_locations':
          return messageParser.getLocationsMessage();

        case 'general_query':
          return this.handleGeneralQuery(parsedMessage);

        default:
          return this.getDefaultResponse();
      }
    } catch (error) {
      logger.error('Error handling query:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  }

  /**
   * Handle menu query for specific location or all locations
   */
  async handleMenuQuery(location) {
    try {
      // Check if cache is expired and refresh if needed
      if (dataCache.isCacheExpired()) {
        logger.info('Cache expired, refreshing data...');
        await this.refreshMenuData();
      }

      if (!location) {
        // Show all locations summary
        const allData = dataCache.getAllMenuData();
        if (!allData || !allData.data) {
          return 'No menu data available yet. Please wait while I fetch the latest information.';
        }

        let response = '📋 *All Cafe Locations Menu Summary*\n\n';
        allData.data.forEach((loc) => {
          const totalProducts = Object.values(loc.products || {})
            .flat()
            .length;
          response += `📍 *${loc.name}*: ${totalProducts} products\n`;
        });

        response += `\n_Last updated: ${new Date(allData.lastUpdate).toLocaleString()}_\n\n`;
        response += 'Ask about a specific location to see detailed menu!';
        
        return response;
      }

      // Show specific location menu
      const menuData = dataCache.getMenuByLocation(location.id);
      
      if (!menuData) {
        return `Sorry, I couldn't find menu data for ${location.name}. Try "refresh menu" to get the latest data.`;
      }

      return whatsapp.formatMenuResponse(menuData);
    } catch (error) {
      logger.error('Error handling menu query:', error);
      return 'Sorry, I had trouble retrieving the menu. Please try again.';
    }
  }

  /**
   * Handle product list query by category
   */
  async handleProductListQuery(category, location) {
    try {
      // Check if cache is expired
      if (dataCache.isCacheExpired()) {
        await this.refreshMenuData();
      }

      if (!category) {
        return 'Please specify a product category (e.g., "Show me edibles" or "List vape products").';
      }

      if (location) {
        // Get products for specific location and category
        const menuData = dataCache.getMenuByLocation(location.id);
        if (!menuData || !menuData.products[category]) {
          return `No ${category} products found at ${location.name}.`;
        }

        const products = menuData.products[category];
        let response = `🌿 *${category.toUpperCase()} at ${location.name}*\n\n`;
        
        if (products.length === 0) {
          return response + 'No products available in this category.';
        }

        products.forEach((product, idx) => {
          if (idx < 10) {
            response += `${idx + 1}. ${product.name} - ${product.price}\n`;
            if (product.thc) response += `   THC: ${product.thc}\n`;
          }
        });

        if (products.length > 10) {
          response += `\n... and ${products.length - 10} more items`;
        }

        return response;
      }

      // Get products across all locations
      const productsData = dataCache.getProductsByCategory(category);
      return whatsapp.formatProductListResponse(category, productsData);
    } catch (error) {
      logger.error('Error handling product list query:', error);
      return 'Sorry, I had trouble retrieving the products. Please try again.';
    }
  }

  /**
   * Handle refresh menu request
   */
  async handleRefreshRequest() {
    if (this.isRefreshing) {
      return 'Menu refresh already in progress. Please wait...';
    }

    try {
      this.isRefreshing = true;
      logger.info('Manual refresh requested');
      
      await this.refreshMenuData();
      
      const lastUpdate = dataCache.getLastUpdate();
      return `✅ Menu data refreshed successfully!\n\n_Updated: ${new Date(lastUpdate).toLocaleString()}_`;
    } catch (error) {
      logger.error('Error refreshing menu:', error);
      return 'Failed to refresh menu data. Please try again later.';
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Handle last update query
   */
  handleLastUpdateQuery() {
    const lastUpdate = dataCache.getLastUpdate();
    
    if (!lastUpdate) {
      return 'No menu data available yet. Send "refresh menu" to fetch the latest data.';
    }

    const updateDate = new Date(lastUpdate);
    const now = new Date();
    const diffMs = now - updateDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    let timeAgo = '';
    if (diffHours > 0) {
      timeAgo = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    }

    return `📅 Menu was last updated:\n${updateDate.toLocaleString()}\n(${timeAgo})`;
  }

  /**
   * Handle general queries
   */
  handleGeneralQuery(parsedMessage) {
    const { location, category } = parsedMessage;
    
    if (location && category) {
      return this.handleProductListQuery(category, location);
    } else if (location) {
      return this.handleMenuQuery(location);
    } else if (category) {
      return this.handleProductListQuery(category, null);
    }

    return this.getDefaultResponse();
  }

  /**
   * Get default response
   */
  getDefaultResponse() {
    return `I'm not sure I understood that. Here are some things you can ask me:

• "What's on the menu at Bloor?"
• "Show me edibles"
• "List vape products at Fort York"
• "When was the menu last updated?"
• "Refresh menu"

Type "help" for more options! 🌿`;
  }

  /**
   * Refresh menu data from website
   */
  async refreshMenuData() {
    try {
      logger.info('Refreshing menu data from website...');
      const menuData = await cafeScraper.scrapeAllLocations();
      await dataCache.saveMenuData(menuData);
      logger.info('Menu data refreshed and cached successfully');
    } catch (error) {
      logger.error('Failed to refresh menu data:', error);
      throw error;
    }
  }
}

export default new QueryHandler();
