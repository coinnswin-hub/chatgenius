import logger from '../utils/logger.js';
import config from '../utils/config.js';

class MessageParser {
  constructor() {
    this.locationKeywords = config.locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      keywords: [loc.name.toLowerCase(), loc.id],
    }));

    this.categoryKeywords = config.categories.map((cat) => ({
      name: cat,
      keywords: [cat, cat.replace('-', ' ')],
    }));
  }

  /**
   * Parse user message and extract intent
   */
  parseMessage(message) {
    const lowerMessage = message.toLowerCase().trim();
    
    logger.info(`Parsing message: "${message}"`);

    // Detect intent
    const intent = this.detectIntent(lowerMessage);
    
    // Extract entities
    const location = this.extractLocation(lowerMessage);
    const category = this.extractCategory(lowerMessage);

    const parsed = {
      original: message,
      intent: intent,
      location: location,
      category: category,
    };

    logger.info(`Parsed intent: ${intent}, Location: ${location?.name || 'all'}, Category: ${category || 'all'}`);

    return parsed;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message) {
    // Menu queries
    if (
      message.includes('menu') ||
      message.includes('what') && (message.includes('available') || message.includes('have')) ||
      message.includes('show') && message.includes('menu')
    ) {
      return 'get_menu';
    }

    // List products by category
    if (
      message.includes('list') ||
      message.includes('show me') ||
      message.includes('available') ||
      message.includes('have any')
    ) {
      return 'list_products';
    }

    // Refresh/update menu
    if (
      message.includes('refresh') ||
      message.includes('update') ||
      message.includes('latest')
    ) {
      return 'refresh_menu';
    }

    // Last update time
    if (
      message.includes('when') && (message.includes('updated') || message.includes('last'))
    ) {
      return 'last_update';
    }

    // Help
    if (
      message.includes('help') ||
      message.includes('what can you') ||
      message.includes('how do')
    ) {
      return 'help';
    }

    // Locations list
    if (
      message.includes('location') ||
      message.includes('where') ||
      message.includes('address')
    ) {
      return 'list_locations';
    }

    // Default to general query
    return 'general_query';
  }

  /**
   * Extract location from message
   */
  extractLocation(message) {
    for (const location of this.locationKeywords) {
      for (const keyword of location.keywords) {
        if (message.includes(keyword)) {
          return {
            id: location.id,
            name: location.name,
          };
        }
      }
    }
    return null;
  }

  /**
   * Extract category from message
   */
  extractCategory(message) {
    for (const category of this.categoryKeywords) {
      for (const keyword of category.keywords) {
        if (message.includes(keyword)) {
          return category.name;
        }
      }
    }
    return null;
  }

  /**
   * Generate help message
   */
  getHelpMessage() {
    return `🤖 *CAFE Assistant Help*

I can help you with:

*Menu Queries:*
• "What's on the menu at Bloor?"
• "Show menu for Fort York"
• "Menu at Yonge"

*Product Searches:*
• "Show edibles available"
• "List vape products at Scarborough"
• "Show me concentrates"

*Information:*
• "List all locations"
• "When was the menu last updated?"
• "Refresh menu" - Get latest data

*Locations:*
${config.locations.map((loc) => `• ${loc.name}`).join('\n')}

*Categories:*
${config.categories.map((cat) => `• ${cat}`).join('\n')}

Just send me a message with what you're looking for! 🌿`;
  }

  /**
   * Generate locations list message
   */
  getLocationsMessage() {
    let message = '📍 *Cafe Dispensary Locations in Toronto*\n\n';
    
    config.locations.forEach((location) => {
      message += `• *${location.name}*\n`;
    });

    message += '\nTo see a specific menu, just ask:\n';
    message += '"Show me the menu at [location name]"';

    return message;
  }
}

export default new MessageParser();
