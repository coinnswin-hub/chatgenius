import express from 'express';
import cron from 'node-cron';
import logger from './utils/logger.js';
import config from './utils/config.js';
import dataCache from './utils/dataCache.js';
import cafeScraper from './scrapers/cafeScraper.js';
import whatsapp from './messaging/whatsapp.js';
import messageParser from './handlers/messageParser.js';
import queryHandler from './handlers/queryHandler.js';

class CafeAgent {
  constructor() {
    this.app = express();
    this.isInitialized = false;
    this.cronJob = null;
  }

  /**
   * Initialize the CAFE agent
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing CAFE Agent...');

      // Setup Express middleware
      this.setupMiddleware();

      // Initialize data cache
      await dataCache.initialize();

      // Test connection to Cafe website
      const websiteConnected = await cafeScraper.testConnection();
      if (!websiteConnected) {
        logger.warn('Could not connect to Cafe website. Will retry on first data fetch.');
      }

      // Initial data fetch
      try {
        if (!dataCache.getAllMenuData()) {
          logger.info('No cached data found. Fetching initial data...');
          await this.fetchMenuData();
        } else {
          logger.info('Loaded existing cached data');
        }
      } catch (error) {
        logger.error('Failed initial data fetch:', error.message);
      }

      // Initialize WhatsApp messaging
      await whatsapp.initialize();

      // Setup webhook routes
      this.setupRoutes();

      // Schedule periodic data refresh
      this.scheduleDataRefresh();

      this.isInitialized = true;
      logger.info('✅ CAFE Agent initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize CAFE Agent:', error);
      throw error;
    }
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      const lastUpdate = dataCache.getLastUpdate();
      res.json({
        status: 'healthy',
        agent: 'CAFE',
        lastUpdate: lastUpdate,
        initialized: this.isInitialized,
      });
    });

    // WhatsApp webhook for incoming messages (Twilio)
    this.app.post('/webhook/whatsapp', async (req, res) => {
      try {
        logger.info('Received WhatsApp webhook');

        // Parse incoming message
        const incomingMsg = whatsapp.handleIncomingMessage(req);
        
        // Parse user intent
        const parsedMessage = messageParser.parseMessage(incomingMsg.body);
        
        // Handle query and get response
        const response = await queryHandler.handleQuery(parsedMessage);
        
        // Send response back to user
        await whatsapp.sendMessage(incomingMsg.from, response);
        
        res.status(200).send('OK');
      } catch (error) {
        logger.error('Error handling WhatsApp webhook:', error);
        res.status(500).send('Error processing message');
      }
    });

    // Manual data refresh endpoint
    this.app.post('/api/refresh', async (req, res) => {
      try {
        logger.info('Manual refresh triggered via API');
        await this.fetchMenuData();
        res.json({
          success: true,
          lastUpdate: dataCache.getLastUpdate(),
        });
      } catch (error) {
        logger.error('Manual refresh failed:', error);
        res.status(500).json({
          success: false,
          error: error.message,
        });
      }
    });

    // Get cached menu data endpoint
    this.app.get('/api/menu', (req, res) => {
      const menuData = dataCache.getAllMenuData();
      res.json(menuData || { error: 'No data available' });
    });

    // Get menu for specific location
    this.app.get('/api/menu/:locationId', (req, res) => {
      const menuData = dataCache.getMenuByLocation(req.params.locationId);
      if (menuData) {
        res.json(menuData);
      } else {
        res.status(404).json({ error: 'Location not found' });
      }
    });

    // Test message parsing
    this.app.post('/api/test/parse', (req, res) => {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message required' });
      }
      const parsed = messageParser.parseMessage(message);
      res.json(parsed);
    });
  }

  /**
   * Fetch menu data from website
   */
  async fetchMenuData() {
    try {
      logger.info('Fetching menu data from Cafe website...');
      const menuData = await cafeScraper.scrapeAllLocations();
      await dataCache.saveMenuData(menuData);
      logger.info('Menu data fetched and cached successfully');
    } catch (error) {
      logger.error('Failed to fetch menu data:', error);
      throw error;
    }
  }

  /**
   * Schedule periodic data refresh
   */
  scheduleDataRefresh() {
    const intervalMinutes = config.cafe.scrapeInterval;
    
    // Schedule using cron (every N minutes)
    const cronExpression = `*/${intervalMinutes} * * * *`;
    
    this.cronJob = cron.schedule(cronExpression, async () => {
      try {
        logger.info('Scheduled data refresh triggered');
        await this.fetchMenuData();
      } catch (error) {
        logger.error('Scheduled refresh failed:', error);
      }
    });

    logger.info(`Scheduled data refresh every ${intervalMinutes} minutes`);
  }

  /**
   * Start the CAFE agent server
   */
  async start() {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const port = config.app.port;
      
      this.app.listen(port, () => {
        logger.info(`🌿 CAFE Agent listening on port ${port}`);
        logger.info(`Environment: ${config.app.nodeEnv}`);
        logger.info('Webhook URL: http://localhost:' + port + '/webhook/whatsapp');
        logger.info('Health check: http://localhost:' + port + '/health');
      });
    } catch (error) {
      logger.error('Failed to start CAFE Agent:', error);
      process.exit(1);
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    logger.info('Shutting down CAFE Agent...');
    
    if (this.cronJob) {
      this.cronJob.stop();
    }
    
    logger.info('CAFE Agent shut down complete');
    process.exit(0);
  }
}

// Create and export agent instance
const agent = new CafeAgent();

// Handle shutdown signals
process.on('SIGINT', () => agent.shutdown());
process.on('SIGTERM', () => agent.shutdown());

export default agent;
