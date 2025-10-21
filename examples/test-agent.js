#!/usr/bin/env node

/**
 * Example script to test CAFE agent functionality
 * Run with: node examples/test-agent.js
 */

import axios from 'axios';

const BASE_URL = 'http://localhost:3000';

// Example test queries
const testQueries = [
  'What is on the menu at Bloor?',
  'Show me edibles at Fort York',
  'List vape products',
  'When was the menu last updated?',
  'Help',
  'List all locations',
  'Show me concentrates at Yonge',
  'Refresh menu',
];

async function testAgent() {
  console.log('🧪 Testing CAFE Agent\n');
  console.log('='.repeat(60));

  // Check health
  try {
    const health = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Agent Health:', health.data);
    console.log('='.repeat(60));
  } catch (error) {
    console.error('❌ Agent is not running. Start with: npm start');
    process.exit(1);
  }

  // Test message parsing
  console.log('\n📝 Testing Message Parsing:\n');
  
  for (const query of testQueries) {
    try {
      const response = await axios.post(`${BASE_URL}/api/test/parse`, {
        message: query,
      });
      
      const { intent, location, category } = response.data;
      
      console.log(`Query: "${query}"`);
      console.log(`  → Intent: ${intent}`);
      if (location) console.log(`  → Location: ${location.name}`);
      if (category) console.log(`  → Category: ${category}`);
      console.log('');
    } catch (error) {
      console.error(`Error parsing "${query}":`, error.message);
    }
  }

  console.log('='.repeat(60));

  // Test menu API
  console.log('\n📋 Testing Menu API:\n');
  
  try {
    const menuResponse = await axios.get(`${BASE_URL}/api/menu`);
    const menu = menuResponse.data;
    
    console.log(`Last Update: ${menu.lastUpdate}`);
    console.log(`Locations: ${menu.data.length}`);
    
    menu.data.forEach((location) => {
      const productCount = Object.values(location.products || {}).flat().length;
      console.log(`  - ${location.name}: ${productCount} products`);
      if (location.error) {
        console.log(`    ⚠️  Error: ${location.error}`);
      }
    });
  } catch (error) {
    console.error('Error fetching menu:', error.message);
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Testing complete!\n');
}

// Run tests
testAgent().catch(console.error);
