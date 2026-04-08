const { Pool } = require("pg");

const pool = new Pool({
  host: "localhost",
  user: "postgres",
  password: "123456",
    database: "uniGestao",
  port: 5432,
});

module.exports = pool;
