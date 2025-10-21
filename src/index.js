import agent from './agent.js';
import logger from './utils/logger.js';

/**
 * CAFE - Intelligent Autonomous Agent
 * 
 * Mission: Connect to Cafe Dispensary website and provide menu information
 * via WhatsApp and other messaging channels
 */

async function main() {
  try {
    logger.info('========================================');
    logger.info('      CAFE AUTONOMOUS AGENT v1.0       ');
    logger.info('========================================');
    logger.info('Mission: Cafe Dispensary Information Assistant');
    logger.info('');

    // Start the agent
    await agent.start();
  } catch (error) {
    logger.error('Fatal error starting CAFE Agent:', error);
    process.exit(1);
  }
}

// Start the application
main();
