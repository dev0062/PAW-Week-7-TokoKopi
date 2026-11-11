/**
 * ============================================================================
 * FILE: config/database.js
 * ============================================================================
 * Konfigurasi Koneksi Database PostgreSQL menggunakan Sequelize ORM.
 * Dilengkapi auto-create database (`devtech_db`) jika belum ada di pgAdmin.
 * ============================================================================
 */

const { Sequelize } = require('sequelize');
const { Client } = require('pg');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'devtech_db',
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  dialect: 'postgres'
};

// Instance Sequelize Utama
const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: 'postgres',
    logging: false, // Set ke console.log jika ingin melihat raw SQL query di terminal
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

/**
 * Memastikan database sudah tersedia di PostgreSQL (pgAdmin).
 * Jika database `devtech_db` belum dibuat, fungsi ini akan membuatnya otomatis.
 */
async function ensureDatabaseExists() {
  const client = new Client({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.username,
    password: dbConfig.password,
    database: 'postgres' // Connect ke default db postgres terlebih dahulu
  });

  try {
    await client.connect();
    const checkRes = await client.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [dbConfig.database]
    );

    if (checkRes.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbConfig.database}"`);
      console.log(`[Database] Database "${dbConfig.database}" berhasil dibuat otomatis di PostgreSQL.`);
    }
  } catch (err) {
    console.warn(`[Database] Info pengecekan database: ${err.message}`);
  } finally {
    try {
      await client.end();
    } catch (e) {}
  }
}

module.exports = {
  sequelize,
  dbConfig,
  ensureDatabaseExists
};
