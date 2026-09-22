const fs = require("node:fs/promises");
const path = require("node:path");
const pool = require("./pool");

const migrations = [
  path.resolve(__dirname, "../../codeSQL/migrations/001_ai_grade_import.sql"),
];

async function runMigrations(db = pool) {
  const client = await db.connect();
  try {
    await client.query("SELECT pg_advisory_lock(2026092101)");
    for (const migration of migrations) {
      const sql = await fs.readFile(migration, "utf8");
      await client.query(sql);
    }
  } finally {
    try {
      await client.query("SELECT pg_advisory_unlock(2026092101)");
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  require("dotenv").config();
  runMigrations()
    .then(async () => {
      console.log("Migrações do agente aplicadas.");
      await pool.end();
    })
    .catch(async (error) => {
      console.error("Erro ao aplicar migrações:", error.message);
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { runMigrations };
