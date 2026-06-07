const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const dbName = process.env.DB_NAME || 'github_analyzer_db';

let pool = null;

const createTableQuery = `
  CREATE TABLE IF NOT EXISTS github_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(100) NOT NULL UNIQUE,
      name VARCHAR(255) NULL,
      bio TEXT NULL,
      avatar_url VARCHAR(500) NULL,
      github_url VARCHAR(500) NOT NULL,
      followers INT NOT NULL DEFAULT 0,
      following INT NOT NULL DEFAULT 0,
      public_repos INT NOT NULL DEFAULT 0,
      public_gists INT NOT NULL DEFAULT 0,
      account_created_at TIMESTAMP NULL,
      top_language VARCHAR(100) NULL,
      total_stars INT NOT NULL DEFAULT 0,
      total_forks INT NOT NULL DEFAULT 0,
      engagement_score DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
      profile_level VARCHAR(50) NOT NULL,
      languages_breakdown JSON NULL,
      top_repos JSON NULL,
      analysis_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_username (username),
      INDEX idx_engagement_score (engagement_score),
      INDEX idx_followers (followers),
      INDEX idx_analysis_date (analysis_date)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const initializeDatabase = async () => {
  try {
    // 1. Try to connect to target database directly first (supports Railway where DB pre-exists)
    try {
      pool = mysql.createPool({
        ...dbConfig,
        database: dbName,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: '+00:00'
      });

      const connection = await pool.getConnection();
      await connection.query(createTableQuery);
      connection.release();
      
      console.log(`[Database] Connection pool established successfully for database "${dbName}".`);
      return;
    } catch (dbError) {
      // If the database doesn't exist, we fall back to creating it (typical for local environments)
      if (dbError.code !== 'ER_BAD_DB_ERROR') {
        throw dbError; // Bubble up other errors (e.g. invalid credentials)
      }
      console.log(`[Database] Database "${dbName}" not found. Attempting auto-creation...`);
    }

    // 2. Connect without database, create DB, create table
    const connection = await mysql.createConnection(dbConfig);
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    await connection.query(createTableQuery);
    await connection.end();

    // Re-create the pool with the database specified
    pool = mysql.createPool({
      ...dbConfig,
      database: dbName,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      timezone: '+00:00'
    });

    console.log(`[Database] Database and table successfully created. Connection established for "${dbName}".`);
  } catch (error) {
    console.error('[Database] Connection failed. Please ensure MySQL is running and credentials in .env are correct.');
    console.error(error.message);
    throw error;
  }
};

const dbPromise = initializeDatabase();

module.exports = {
  async query(sql, params) {
    await dbPromise;
    return pool.query(sql, params);
  },
  async getConnection() {
    await dbPromise;
    return pool.getConnection();
  }
};

