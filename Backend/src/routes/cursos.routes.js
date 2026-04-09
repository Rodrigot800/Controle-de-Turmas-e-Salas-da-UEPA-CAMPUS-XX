// src/routes/cursos.js
const express = require("express");
const router = express.Router();
const pool = require("../db/pool"); // seu pool do PostgreSQL

// ===========================
// Listar todos os cursos
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nome,
        vagas,
        semestres
      FROM cursos
      ORDER BY nome
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar cursos:", error);
    res.status(500).json({ erro: "Erro ao listar cursos" });
  }
});

// ===========================
// Criar novo curso
// ===========================
router.post("/", async (req, res) => {
  const { nome, vagas, semestres } = req.body;

  if (!nome || !vagas || !semestres) {
    return res
      .status(400)
      .json({ erro: "Campos nome, vagas e semestres são obrigatórios" });
  }
  // antes de inserir, verifica se já existe
  const cursoExistente = await pool.query(
    "SELECT * FROM cursos WHERE nome = $1",
    [nome],
  );

  if (cursoExistente.rows.length > 0) {
    return res.status(400).json({ erro: "Curso com este nome já existe" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO cursos (nome, vagas, semestres) VALUES ($1, $2, $3) RETURNING *",
      [nome, Number(vagas), Number(semestres)],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar curso:", err.message);
    res.status(500).json({ erro: "Erro ao criar curso" });
  }
});

// ===========================
// Deletar curso por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM cursos WHERE id = $1", [id]);
    res.json({ mensagem: "Curso removido" });
  } catch (err) {
    console.error("Erro ao remover curso:", err.message);
    res.status(500).json({ erro: "Erro ao remover curso" });
  }
});

module.exports = router;
