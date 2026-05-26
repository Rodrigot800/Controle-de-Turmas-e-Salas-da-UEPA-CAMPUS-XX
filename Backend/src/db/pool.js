// db/pool.js
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "192.168.10.231",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "systemhidrazil@2026",
  database: process.env.DB_NAME || "hydrazil_db",
  port: process.env.DB_PORT || 5432,
});

module.exports = pool;
