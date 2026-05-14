const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ===========================
// Listar todas as disciplinas
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nome,
        carga_horaria as duracao
      FROM disciplinas
      ORDER BY nome
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar disciplinas:", error);
    res.status(500).json({ erro: "Erro ao listar disciplinas" });
  }
});

// ===========================
// Criar nova disciplina
// ===========================
router.post("/", async (req, res) => {
  const { nome, duracao } = req.body;

  if (!nome) {
    return res
      .status(400)
      .json({ erro: "O campo nome é obrigatório" });
  }

  const duracaoVal = duracao ? Number(duracao) : null;

  try {
    const result = await pool.query(
      "INSERT INTO disciplinas (nome, carga_horaria) VALUES ($1, $2) RETURNING id, nome, carga_horaria as duracao",
      [nome, duracaoVal],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar disciplina:", err.message);
    res.status(500).json({ erro: "Erro ao criar disciplina" });
  }
});


// ===========================
// Deletar disciplina por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM disciplinas WHERE id = $1", [id]);
    res.json({ mensagem: "Disciplina removida" });
  } catch (err) {
    console.error("Erro ao remover disciplina:", err.message);
    res.status(500).json({ erro: "Erro ao remover disciplina" });
  }
});

// ===========================
// Editar disciplina por ID
// ===========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, duracao } = req.body;

  if (!nome) {
    return res.status(400).json({
      erro: "O campo nome é obrigatório",
    });
  }

  const duracaoVal = duracao ? Number(duracao) : null;

  try {
    const result = await pool.query(
      `UPDATE disciplinas 
       SET nome = $1, carga_horaria = $2 
       WHERE id = $3 
       RETURNING id, nome, carga_horaria as duracao`,
      [nome, duracaoVal, id]
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


module.exports = router;
