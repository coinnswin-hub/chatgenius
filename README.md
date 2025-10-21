# CAFE - Intelligent Autonomous Chatbot

🤖 **CAFE** is an intelligent autonomous agent that connects to the Cafe Dispensary website (https://www.iamcafe.com/) and provides real-time menu information via WhatsApp and other messaging channels.

## 🎯 Mission

Develop, maintain, and operate a chatbot system that:
- Monitors and scrapes menu data from all six Cafe Dispensary locations in Toronto
- Keeps product and menu data continuously synchronized
- Responds intelligently to user queries via WhatsApp
- Provides information about products, prices, availability, and deals

## ✨ Features

### Core Capabilities
- **🌐 Website Integration**: Connects to https://www.iamcafe.com/ to scrape menu data
- **📱 WhatsApp Messaging**: Primary interface using Twilio or Meta WhatsApp Business API
- **🗄️ Data Caching**: Local JSON-based storage for quick retrieval
- **🔄 Auto-Refresh**: Periodic data updates (configurable interval)
- **🧠 Intent Recognition**: Smart parsing of user queries
- **📍 Multi-Location**: Supports all 6 Toronto Cafe locations

### Supported Locations
- Bloor
- Fort York
- Scarborough
- Yonge
- Junction
- Queen West

### Product Categories
- Flower
- Pre-rolls
- Edibles
- Concentrates
- Vapes
- Beverages
- Accessories

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Twilio account (for WhatsApp integration) OR Meta WhatsApp Business API access

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/coinnswin-hub/chatgenius.git
   cd chatgenius
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your configuration:
   ```env
   # Twilio WhatsApp Configuration
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
   
   # Application Settings
   PORT=3000
   SCRAPE_INTERVAL_MINUTES=60
   ```

4. **Start the agent**
   ```bash
   npm start
   ```

## 📖 Usage

### Starting the Agent

```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The agent will:
1. Initialize and authenticate with WhatsApp API
2. Fetch initial menu data from Cafe website
3. Start the webhook server for incoming messages
4. Schedule periodic data refreshes

### Example User Queries

**Menu Queries:**
- "What's on the menu at Bloor?"
- "Show menu for Fort York"
- "What do you have at Yonge?"

**Product Searches:**
- "Show me edibles"
- "List vape products at Scarborough"
- "What concentrates are available?"

**Information:**
- "List all locations"
- "When was the menu last updated?"
- "Refresh menu"
- "Help"

### API Endpoints

The agent exposes several REST API endpoints:

- `GET /health` - Health check and status
- `GET /api/menu` - Get all cached menu data
- `GET /api/menu/:locationId` - Get menu for specific location
- `POST /api/refresh` - Manually trigger data refresh
- `POST /webhook/whatsapp` - WhatsApp webhook endpoint
- `POST /api/test/parse` - Test message parsing

## 🏗️ Architecture

```
src/
├── index.js                 # Main entry point
├── agent.js                 # Core agent orchestrator
├── scrapers/
│   └── cafeScraper.js      # Website scraping logic
├── messaging/
│   └── whatsapp.js         # WhatsApp messaging handler
├── handlers/
│   ├── messageParser.js    # Intent recognition & parsing
│   └── queryHandler.js     # Query processing & responses
├── utils/
│   ├── logger.js           # Winston logging configuration
│   ├── config.js           # Application configuration
│   └── dataCache.js        # Data caching system
└── data/
    └── cache/              # Cached menu data (JSON)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `TWILIO_ACCOUNT_SID` | Twilio Account SID | - |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token | - |
| `TWILIO_WHATSAPP_NUMBER` | Twilio WhatsApp Number | whatsapp:+14155238886 |
| `CAFE_WEBSITE_URL` | Cafe website URL | https://www.iamcafe.com/ |
| `SCRAPE_INTERVAL_MINUTES` | Data refresh interval | 60 |
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment | development |
| `LOG_LEVEL` | Logging level | info |

### WhatsApp Setup

#### Option 1: Twilio WhatsApp API

1. Create a Twilio account at https://www.twilio.com/
2. Set up WhatsApp sandbox or request production access
3. Configure webhook URL: `https://your-domain.com/webhook/whatsapp`
4. Add credentials to `.env`

#### Option 2: Meta WhatsApp Business Cloud API

1. Create Meta Business account
2. Set up WhatsApp Business API
3. Configure webhook endpoint
4. Update `.env` with Meta credentials

## 🔒 Security Notes

- Never commit `.env` file to version control
- Keep API credentials secure
- Use environment variables for all sensitive data
- Consider implementing rate limiting for production
- Validate webhook signatures from Twilio/Meta

## 📊 Monitoring & Logs

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

Console output in development mode shows:
- Incoming messages
- Intent parsing results
- Data refresh operations
- API requests

## 🛠️ Development

### Project Structure

The codebase follows a modular architecture:
- **Scrapers**: Web scraping logic (easily adaptable to API if available)
- **Messaging**: Platform-specific messaging handlers
- **Handlers**: Business logic for parsing and responding
- **Utils**: Shared utilities (logging, config, caching)

### Extending the Agent

**Add a new messaging platform:**
1. Create handler in `src/messaging/`
2. Implement message sending/receiving
3. Add webhook route in `agent.js`

**Customize scraping logic:**
1. Edit `src/scrapers/cafeScraper.js`
2. Update selectors based on website structure
3. Test with different locations

**Add new intents:**
1. Update `messageParser.js` with new patterns
2. Add handler in `queryHandler.js`
3. Format response appropriately

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC License

## 🐛 Troubleshooting

**Agent not receiving messages:**
- Verify Twilio webhook is correctly configured
- Check WhatsApp number format includes `whatsapp:` prefix
- Ensure server is publicly accessible (use ngrok for local testing)

**No menu data showing:**
- Check website connection with `/health` endpoint
- Manually trigger refresh: `POST /api/refresh`
- Review logs for scraping errors
- Website structure may have changed - update selectors

**Messages not sending:**
- Verify Twilio credentials in `.env`
- Check account balance and WhatsApp sandbox status
- Review error logs for API failures

## 📞 Support

For issues and questions:
- Check logs in `logs/` directory
- Review configuration in `.env`
- Test endpoints using `/health` and `/api/menu`
- Enable debug logging: `LOG_LEVEL=debug`

---

Built with ❤️ for Cafe Dispensary Toronto 🌿
