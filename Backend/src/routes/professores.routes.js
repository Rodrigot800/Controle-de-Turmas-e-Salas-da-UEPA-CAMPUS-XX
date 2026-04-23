const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Listar todos os professores
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome
      FROM professores
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar professores:", error);
    res.status(500).json({ erro: "Erro ao listar professores" });
  }
});

// Criar novo professor
router.post("/", async (req, res) => {
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Campo nome é obrigatório" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO professores (nome) VALUES ($1) RETURNING *",
      [nome]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar professor:", err.message);
    res.status(500).json({ erro: "Erro ao criar professor" });
  }
});

// Editar professor
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;

  if (!nome) {
    return res.status(400).json({ erro: "Campo nome é obrigatório" });
  }

  try {
    const result = await pool.query(
      "UPDATE professores SET nome = $1 WHERE id = $2 RETURNING *",
      [nome, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Professor não encontrado" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar professor:", err.message);
    res.status(500).json({ erro: "Erro ao editar professor" });
  }
});

// Deletar professor
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM professores WHERE id = $1", [id]);
    res.json({ mensagem: "Professor removido" });
  } catch (err) {
    console.error("Erro ao remover professor:", err.message);
    // Pode falhar se estiver alocado
    res.status(500).json({ erro: "Erro ao remover professor. Ele pode estar alocado a uma disciplina." });
  }
});

module.exports = router;
