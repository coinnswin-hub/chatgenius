import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const config = {
  // WhatsApp Configuration
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886',
  },
  
  // Meta WhatsApp Business API (alternative)
  meta: {
    token: process.env.META_WHATSAPP_TOKEN,
    phoneId: process.env.META_WHATSAPP_PHONE_ID,
    verifyToken: process.env.META_VERIFY_TOKEN || 'cafe-verify-token',
  },

  // Cafe Website Configuration
  cafe: {
    websiteUrl: process.env.CAFE_WEBSITE_URL || 'https://www.iamcafe.com/',
    scrapeInterval: parseInt(process.env.SCRAPE_INTERVAL_MINUTES || '60', 10),
  },

  // Application Configuration
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'info',
  },

  // Data Storage
  data: {
    dataDir: process.env.DATA_DIR || './data',
    cacheDir: process.env.CACHE_DIR || './data/cache',
  },

  // Cafe Locations
  locations: [
    { id: 'bloor', name: 'Bloor', url: '/bloor' },
    { id: 'fort-york', name: 'Fort York', url: '/fort-york' },
    { id: 'scarborough', name: 'Scarborough', url: '/scarborough' },
    { id: 'yonge', name: 'Yonge', url: '/yonge' },
    { id: 'junction', name: 'Junction', url: '/junction' },
    { id: 'queen-west', name: 'Queen West', url: '/queen-west' },
  ],

  // Product Categories
  categories: [
    'flower',
    'pre-rolls',
    'edibles',
    'concentrates',
    'vapes',
    'beverages',
    'accessories',
  ],
};

export default config;
