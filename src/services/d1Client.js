const config = require('../config');

/**
 * Cloudflare D1 Database Client
 * Database: viswasluckydraw_db
 * Database ID: ffd21a79-cb5b-4b4f-b607-6e930b4478ef
 */
class D1Client {
  constructor() {
    this.databaseName = config.cloudflare.databaseName;
    this.databaseId = config.cloudflare.databaseId;
    this.accountId = config.cloudflare.accountId;
    this.apiToken = config.cloudflare.apiToken;
  }

  isConfigured() {
    return Boolean(this.accountId && this.apiToken && this.databaseId);
  }

  /**
   * Execute a raw SQL query directly on Cloudflare D1 via the Cloudflare REST API.
   * @param {string} sql - SQL query string
   * @param {Array} params - Query parameters for parameterized statements
   */
  async query(sql, params = []) {
    if (!this.isConfigured()) {
      return {
        success: false,
        source: 'local_fallback',
        message: 'Cloudflare API Token or Account ID not set in .env. Using application data layer.'
      };
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql, params })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.errors?.[0]?.message || `Cloudflare D1 query failed with status ${response.status}`);
      }

      return {
        success: true,
        source: 'cloudflare_d1',
        result: data.result
      };
    } catch (error) {
      console.error(`[Cloudflare D1 Error]: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute multiple statements in batch on Cloudflare D1
   */
  async batch(statements = []) {
    if (!this.isConfigured()) {
      return { success: false, source: 'local_fallback' };
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}/d1/database/${this.databaseId}/query`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(statements)
    });

    const data = await response.json();
    return data;
  }
}

module.exports = new D1Client();
