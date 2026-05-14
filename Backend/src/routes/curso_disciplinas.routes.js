const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ===========================
// Listar todas as alocações de disciplina a cursos
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        curso_id,
        disciplina_id,
        semestre_disciplina
      FROM curso_disciplinas
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar curso_disciplinas:", error);
    res.status(500).json({ erro: "Erro ao listar curso_disciplinas" });
  }
});

// ===========================
// Criar nova alocação de disciplina para curso
// ===========================
router.post("/", async (req, res) => {
  const { curso_id, disciplina_id, semestre_disciplina } = req.body;


  if (!curso_id || !disciplina_id) {
    return res
      .status(400)
      .json({ erro: "Campos curso_id e disciplina_id são obrigatórios" });
  }

  // Verifica se a alocação já existe
  const alocacaoExistente = await pool.query(
    "SELECT * FROM curso_disciplinas WHERE curso_id = $1 AND disciplina_id = $2",
    [curso_id, disciplina_id],
  );

  if (alocacaoExistente.rows.length > 0) {
    return res.status(400).json({ erro: "Essa disciplina já está alocada a este curso" });
  }

  const semestreVal = semestre_disciplina ? Number(semestre_disciplina) : 1;

  try {
    const result = await pool.query(
      "INSERT INTO curso_disciplinas (curso_id, disciplina_id, semestre_disciplina) VALUES ($1, $2, $3) RETURNING *",
      [Number(curso_id), Number(disciplina_id), semestreVal],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao alocar disciplina ao curso:", err.message);
    res.status(500).json({ erro: "Erro ao alocar disciplina ao curso" });
  }
});

// ===========================
// Deletar alocação por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM curso_disciplinas WHERE id = $1", [id]);
    res.json({ mensagem: "Alocação removida" });
  } catch (err) {
    console.error("Erro ao remover alocação:", err.message);
    res.status(500).json({ erro: "Erro ao remover alocação" });
  }
});

module.exports = router;
