# CAFE Agent Deployment Guide

This guide provides step-by-step instructions for deploying the CAFE autonomous agent to production.

## Prerequisites

- Node.js v18 or higher
- A server with a public IP or domain name (for webhooks)
- Twilio account with WhatsApp API access (or Meta WhatsApp Business account)
- Basic knowledge of server management and Linux commands

## Deployment Steps

### 1. Server Setup

Choose a hosting provider and set up a server:
- **Recommended**: DigitalOcean, AWS EC2, Google Cloud, Heroku
- **Minimum specs**: 1GB RAM, 1 CPU core, 10GB storage
- **OS**: Ubuntu 20.04 LTS or later

### 2. Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### 3. Clone and Setup Application

```bash
# Clone repository
git clone https://github.com/coinnswin-hub/chatgenius.git
cd chatgenius

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
```

### 4. Configure Environment Variables

Edit the `.env` file with your production settings:

```bash
nano .env
```

Required configuration:

```env
# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Application
PORT=3000
NODE_ENV=production
LOG_LEVEL=info

# Scraping interval (in minutes)
SCRAPE_INTERVAL_MINUTES=60
```

### 5. Setup Process Manager (PM2)

Use PM2 to keep the application running:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start application with PM2
pm2 start src/index.js --name cafe-agent

# Configure PM2 to start on boot
pm2 startup
pm2 save

# View logs
pm2 logs cafe-agent

# Check status
pm2 status
```

### 6. Setup Nginx Reverse Proxy

Install and configure Nginx:

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/cafe-agent
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/cafe-agent /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### 7. Setup SSL Certificate (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtain SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### 8. Configure Twilio Webhook

1. Log in to your Twilio Console
2. Go to your WhatsApp Sender
3. Set the webhook URL for incoming messages:
   ```
   https://your-domain.com/webhook/whatsapp
   ```
4. Set the HTTP method to `POST`

### 9. Test the Deployment

```bash
# Check health endpoint
curl https://your-domain.com/health

# Expected response:
# {"status":"healthy","agent":"CAFE","lastUpdate":"...","initialized":true}

# Check logs
pm2 logs cafe-agent

# Monitor the application
pm2 monit
```

### 10. Send Test WhatsApp Message

Send a message to your Twilio WhatsApp number:
```
help
```

You should receive a response with available commands.

## Monitoring and Maintenance

### View Logs

```bash
# PM2 logs
pm2 logs cafe-agent

# Application logs
tail -f logs/combined.log
tail -f logs/error.log
```

### Restart Application

```bash
# Restart with PM2
pm2 restart cafe-agent

# Or manually
pm2 stop cafe-agent
pm2 start cafe-agent
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Restart application
pm2 restart cafe-agent
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# System resources
htop
```

## Security Best Practices

1. **Firewall Configuration**
   ```bash
   sudo ufw allow ssh
   sudo ufw allow http
   sudo ufw allow https
   sudo ufw enable
   ```

2. **Environment Variables**
   - Never commit `.env` file to version control
   - Keep API credentials secure
   - Rotate tokens regularly

3. **Regular Updates**
   ```bash
   # Update system packages
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js dependencies
   npm audit
   npm audit fix
   ```

4. **Backup Configuration**
   - Backup your `.env` file securely
   - Keep a copy of Nginx configuration
   - Document your setup process

## Troubleshooting

### Agent Not Starting

```bash
# Check PM2 status
pm2 status

# View error logs
pm2 logs cafe-agent --err

# Check if port is in use
sudo lsof -i :3000
```

### WhatsApp Messages Not Received

1. Check webhook configuration in Twilio console
2. Verify webhook URL is accessible: `curl https://your-domain.com/webhook/whatsapp`
3. Check application logs for incoming requests
4. Ensure Twilio credentials are correct in `.env`

### Scraping Issues

1. Check internet connectivity from server
2. Verify Cafe website is accessible: `curl https://www.iamcafe.com/`
3. Review error logs for scraping failures
4. Manually trigger refresh: `curl -X POST https://your-domain.com/api/refresh`

### Performance Issues

1. Check system resources: `htop`
2. Review PM2 metrics: `pm2 monit`
3. Check log file sizes: `du -sh logs/`
4. Consider increasing scraping interval if needed

## Scaling Considerations

For high-traffic scenarios:

1. **Horizontal Scaling**: Deploy multiple instances behind a load balancer
2. **Database**: Replace JSON cache with Redis or MongoDB
3. **Queue System**: Use Bull or RabbitMQ for message processing
4. **CDN**: Use Cloudflare for DDoS protection and caching

## Support

For issues or questions:
- Check application logs: `logs/combined.log`
- Review PM2 status: `pm2 status`
- Test API endpoints manually
- Enable debug logging: `LOG_LEVEL=debug`

---

**Note**: This deployment guide assumes a basic production setup. Adjust based on your specific requirements and infrastructure.
