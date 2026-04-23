const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Listar todas as disciplinas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, curso_id
      FROM disciplinas
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    res.status(500).json({ erro: "Erro ao listar disciplinas" });
  }
});

// Criar nova disciplina
router.post("/", async (req, res) => {
  const { nome, curso_id } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Campo nome é obrigatório" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO disciplinas (nome, curso_id) VALUES ($1, $2) RETURNING *",
      [nome, curso_id || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar disciplina:", err.message);
    res.status(500).json({ erro: "Erro ao criar disciplina" });
  }
});

// Editar disciplina
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, curso_id } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Campo nome é obrigatório" });
  }

  try {
    const result = await pool.query(
      "UPDATE disciplinas SET nome = $1, curso_id = $2 WHERE id = $3 RETURNING *",
      [nome, curso_id || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Disciplina não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar disciplina:", err.message);
    res.status(500).json({ erro: "Erro ao editar disciplina" });
  }
});

// Deletar disciplina
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM disciplinas WHERE id = $1", [id]);
    res.json({ mensagem: "Disciplina removida" });
  } catch (err) {
    console.error("Erro ao remover disciplina:", err.message);
    res.status(500).json({ erro: "Erro ao remover disciplina. Ela pode estar vinculada a alguma alocação." });
  }
});

module.exports = router;
