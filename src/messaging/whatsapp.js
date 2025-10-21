import twilio from 'twilio';
import logger from '../utils/logger.js';
import config from '../utils/config.js';

class WhatsAppMessaging {
  constructor() {
    this.client = null;
    this.isInitialized = false;
  }

  /**
   * Initialize Twilio WhatsApp client
   */
  async initialize() {
    try {
      if (!config.twilio.accountSid || !config.twilio.authToken) {
        logger.warn('Twilio credentials not configured. WhatsApp messaging will not be available.');
        return false;
      }

      this.client = twilio(config.twilio.accountSid, config.twilio.authToken);
      
      // Test the connection
      await this.testConnection();
      
      this.isInitialized = true;
      logger.info('WhatsApp messaging initialized successfully');
      return true;
    } catch (error) {
      logger.error('Failed to initialize WhatsApp messaging:', error);
      return false;
    }
  }

  /**
   * Test Twilio connection
   */
  async testConnection() {
    try {
      // Validate credentials by fetching account info
      await this.client.api.accounts(config.twilio.accountSid).fetch();
      logger.info('Twilio connection validated');
      return true;
    } catch (error) {
      logger.error('Twilio connection test failed:', error.message);
      throw error;
    }
  }

  /**
   * Send a WhatsApp message
   */
  async sendMessage(to, message) {
    if (!this.isInitialized) {
      logger.error('WhatsApp messaging not initialized');
      return null;
    }

    try {
      // Ensure 'to' number has whatsapp: prefix
      const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
      
      const result = await this.client.messages.create({
        body: message,
        from: config.twilio.whatsappNumber,
        to: toNumber,
      });

      logger.info(`Message sent successfully to ${toNumber}. SID: ${result.sid}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send message to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Handle incoming WhatsApp webhook
   * This should be called from an Express endpoint
   */
  handleIncomingMessage(req) {
    try {
      const { Body, From, MessageSid } = req.body;
      
      logger.info(`Received message from ${From}: "${Body}"`);
      
      return {
        messageId: MessageSid,
        from: From,
        body: Body,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Failed to parse incoming message:', error);
      throw error;
    }
  }

  /**
   * Validate incoming Twilio webhook signature
   */
  validateWebhook(req, signature) {
    try {
      const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
      return twilio.validateRequest(
        config.twilio.authToken,
        signature,
        url,
        req.body
      );
    } catch (error) {
      logger.error('Failed to validate webhook:', error);
      return false;
    }
  }

  /**
   * Format a menu response for WhatsApp
   */
  formatMenuResponse(menuData) {
    if (!menuData || !menuData.products) {
      return 'No menu data available for this location.';
    }

    let response = `📍 *${menuData.name}*\n`;
    response += `_Last updated: ${new Date(menuData.scrapedAt).toLocaleString()}_\n\n`;

    // Count total products
    let totalProducts = 0;
    Object.values(menuData.products).forEach((products) => {
      totalProducts += products.length;
    });

    if (totalProducts === 0) {
      return response + 'No products currently available.';
    }

    // List products by category
    Object.entries(menuData.products).forEach(([category, products]) => {
      if (products.length > 0) {
        response += `\n*${category.toUpperCase()}* (${products.length} items)\n`;
        
        products.slice(0, 5).forEach((product) => {
          response += `• ${product.name} - ${product.price}\n`;
          if (product.thc) response += `  THC: ${product.thc}\n`;
        });

        if (products.length > 5) {
          response += `  ... and ${products.length - 5} more\n`;
        }
      }
    });

    return response;
  }

  /**
   * Format a product list response
   */
  formatProductListResponse(category, productsData) {
    if (!productsData || productsData.length === 0) {
      return `No ${category} products found across all locations.`;
    }

    let response = `🌿 *${category.toUpperCase()} PRODUCTS*\n\n`;

    productsData.forEach(({ location, products }) => {
      if (products && products.length > 0) {
        response += `\n📍 *${location}*\n`;
        
        products.slice(0, 3).forEach((product) => {
          response += `• ${product.name} - ${product.price}\n`;
        });

        if (products.length > 3) {
          response += `  ... and ${products.length - 3} more\n`;
        }
      }
    });

    return response;
  }
}

export default new WhatsAppMessaging();
