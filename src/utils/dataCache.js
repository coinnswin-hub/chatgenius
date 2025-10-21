import fs from 'fs/promises';
import path from 'path';
import logger from './logger.js';
import config from './config.js';

class DataCache {
  constructor() {
    this.cacheDir = config.data.cacheDir;
    this.menuCache = null;
    this.lastUpdate = null;
  }

  /**
   * Initialize cache directory
   */
  async initialize() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      logger.info('Cache directory initialized');
      
      // Load existing cache if available
      await this.loadFromDisk();
    } catch (error) {
      logger.error('Failed to initialize cache:', error);
      throw error;
    }
  }

  /**
   * Save menu data to cache
   */
  async saveMenuData(menuData) {
    try {
      this.menuCache = {
        data: menuData,
        lastUpdate: new Date().toISOString(),
      };
      
      const filePath = path.join(this.cacheDir, 'menu-data.json');
      await fs.writeFile(filePath, JSON.stringify(this.menuCache, null, 2));
      
      this.lastUpdate = this.menuCache.lastUpdate;
      logger.info('Menu data cached successfully');
      
      return this.menuCache;
    } catch (error) {
      logger.error('Failed to save menu data:', error);
      throw error;
    }
  }

  /**
   * Load cached menu data from disk
   */
  async loadFromDisk() {
    try {
      const filePath = path.join(this.cacheDir, 'menu-data.json');
      const data = await fs.readFile(filePath, 'utf-8');
      this.menuCache = JSON.parse(data);
      this.lastUpdate = this.menuCache.lastUpdate;
      
      logger.info(`Loaded cached menu data from ${this.lastUpdate}`);
      return this.menuCache;
    } catch (error) {
      if (error.code === 'ENOENT') {
        logger.info('No cached data found, starting fresh');
        return null;
      }
      logger.error('Failed to load cached data:', error);
      throw error;
    }
  }

  /**
   * Get menu data for a specific location
   */
  getMenuByLocation(locationId) {
    if (!this.menuCache || !this.menuCache.data) {
      return null;
    }

    return this.menuCache.data.find(
      (loc) => loc.id === locationId || loc.name.toLowerCase() === locationId.toLowerCase()
    );
  }

  /**
   * Get products by category across all locations
   */
  getProductsByCategory(category) {
    if (!this.menuCache || !this.menuCache.data) {
      return [];
    }

    const products = [];
    this.menuCache.data.forEach((location) => {
      if (location.products && location.products[category]) {
        products.push({
          location: location.name,
          products: location.products[category],
        });
      }
    });

    return products;
  }

  /**
   * Get all menu data
   */
  getAllMenuData() {
    return this.menuCache;
  }

  /**
   * Get last update timestamp
   */
  getLastUpdate() {
    return this.lastUpdate;
  }

  /**
   * Check if cache is expired (older than configured interval)
   */
  isCacheExpired() {
    if (!this.lastUpdate) {
      return true;
    }

    const lastUpdateTime = new Date(this.lastUpdate).getTime();
    const now = Date.now();
    const intervalMs = config.cafe.scrapeInterval * 60 * 1000;

    return now - lastUpdateTime > intervalMs;
  }
}

export default new DataCache();
