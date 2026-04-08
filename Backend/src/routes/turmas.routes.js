const express = require("express");
const router = express.Router();
const pool = require("../db/pool"); 


// ===========================
// Listar todos as Turmas
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM turmas ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar cursos:", err.message);
    res.status(500).json({ erro: "Erro ao listar cursos" });
  }
});

// ===========================
// Criar novo curso
// ===========================
router.post("/", async (req, res) => {
  const { nome, cursoId, semestreInicio, anoInicio, turno } = req.body;


  if (!nome || !cursoId || !semestreInicio || !anoInicio || !turno) {
    return res
      .status(400)
      .json({ erro: "Campos nome, cursoId, semestreInicio, anoInicio e turno são obrigatórios" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO turmas (nome, curso_id, semestre_inicio, ano_inicio, turno) VALUES ($1, $2, $3,$4,$5) RETURNING *",
      [nome, Number(cursoId), Number(semestreInicio), Number(anoInicio), turno],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar turma:", err.message);
    res.status(500).json({ erro: "Erro ao criar turma" });
  }
});

// ===========================
// Deletar curso por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM turmas WHERE id = $1", [id]);
    res.json({ mensagem: "Turma removida" });
  } catch (err) {
    console.error("Erro ao remover turma:", err.message);
    res.status(500).json({ erro: "Erro ao remover turma" });
  }
});

module.exports = router;
