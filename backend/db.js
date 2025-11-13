// backend/db.js
const { Pool } = require('pg');

// The Pool constructor will automatically use the DATABASE_URL environment variable
// if it's available, which is convenient for services like Neon.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // For Neon and other cloud providers that require SSL
    rejectUnauthorized: false, 
  },
});

// Export a query function that will be used throughout the app
module.exports = (text, params) => pool.query(text, params);
