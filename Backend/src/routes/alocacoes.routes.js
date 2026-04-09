const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Listar todas as alocações
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM alocacoes ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar alocacoes:", err.message);
    res.status(500).json({ erro: "Erro ao listar alocacoes" });
  }
});

// Criar nova alocação
router.post("/", async (req, res) => {
  const { turmaId, salaId, turno, timeAlocacao, anoTemp, semestreTemp } =
    req.body;

  if (timeAlocacao === "temporario" && (!anoTemp || !semestreTemp)) {
    return res.status(400).json({
      erro: "Para alocações temporárias, anoTemp e semestreTemp são obrigatórios",
    });
  }

  // Para alocações temporárias, anoTemp e semestreTemp são obrigatórios
  if (timeAlocacao === "temporario" && (!anoTemp || !semestreTemp)) {
    return res.status(400).json({
      erro: "Para alocações temporárias, anoTemp e semestreTemp são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alocacoes 
        (turma_id, sala_id, turno, time_alocacao, ano_temp, semestre_temp)
        VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        Number(turmaId),
        Number(salaId),
        turno,
        timeAlocacao,
        timeAlocacao === "temporario" ? Number(anoTemp) : null,
        timeAlocacao === "temporario" ? Number(semestreTemp) : null,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar alocacao:", err);
    res.status(500).json({ erro: err.message });
  }
});

// Deletar alocação por ID
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query("DELETE FROM alocacoes WHERE id = $1", [
      id,
    ]);
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: "Alocacao não encontrada" });
    }
    res.json({ mensagem: "Alocacao removida" });
  } catch (err) {
    console.error("Erro ao remover alocacao:", err.message);
    res.status(500).json({ erro: "Erro ao remover alocacao" });
  }
});

module.exports = router;
