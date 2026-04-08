const express = require("express");
const router = express.Router();
const pool = require("../db");

router.post("/", async (req, res) => {
  const { nome, cursoId, semestreInicio, anoInicio, turno } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO turmas 
            (nome, curso_id, semestre_inicio, ano_inicio, turno)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *`,
      [nome, cursoId, semestreInicio, anoInicio, turno],
    );

    res.json(result.rows[0]);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ erro: erro.message });
  }
});

router.get("/", async (req, res) => {
  const result = await pool.query(`
        SELECT 
            t.*,
            c.nome as curso_nome
        FROM turmas t
        JOIN cursos c ON c.id = t.curso_id
    `);

  res.json(result.rows);
});

module.exports = router;
