const express = require("express");
const router = express.Router();
const pool = require("../db/pool"); 


// Buscar turmas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        turmas.id,
        turmas.nome,
        turmas.curso_id,
        turmas.semestre_inicio,
        turmas.ano_inicio,
        turmas.turno,
        cursos.nome AS curso_nome
      FROM turmas
      JOIN cursos ON turmas.curso_id = cursos.id
      ORDER BY turmas.nome
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    res.status(500).json({ erro: "Erro ao buscar turmas" });
  }
});


// ===========================
// Criar novo turma
// ===========================
router.post("/", async (req, res) => {
  const { nome, cursoId, semestreInicio, anoInicio, turno } = req.body;


  if (!nome || !cursoId || !semestreInicio || !anoInicio || !turno) {
    return res
      .status(400)
      .json({ erro: "Campos nome, cursoId, semestreInicio, anoInicio e turno são obrigatórios" });
  }
  

  try {
        // Checa se já existe turma com mesmo nome e ano
        const check = await pool.query(
            "SELECT * FROM turmas WHERE nome = $1 AND ano_inicio = $2",
            [nome, anoInicio]
        );

      if (check.rowCount > 0) {
        return res.status(400).json({ error: "Já existe uma turma com esse nome neste ano." });
      }
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
// Deletar turma por ID
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

// ===========================
// Editar turma por ID
// ===========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, cursoId, semestreInicio, anoInicio, turno } = req.body;

  if (!nome || !cursoId || !semestreInicio || !anoInicio || !turno) {
    return res.status(400).json({
      erro: "Campos nome, cursoId, semestreInicio, anoInicio e turno são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE turmas 
       SET nome = $1, curso_id = $2, semestre_inicio = $3, ano_inicio = $4, turno = $5 
       WHERE id = $6 
       RETURNING *`,
      [nome, Number(cursoId), Number(semestreInicio), Number(anoInicio), turno, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Turma não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar turma:", err.message);
    res.status(500).json({ erro: "Erro ao editar turma" });
  }
});

module.exports = router;
