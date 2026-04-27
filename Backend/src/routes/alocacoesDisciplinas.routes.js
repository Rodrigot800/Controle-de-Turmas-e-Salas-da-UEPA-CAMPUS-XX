const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Listar todas as alocações de disciplinas
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        ad.id, 
        ad.turma_id, 
        ad.disciplina_id, 
        ad.professor_id, 
        ad.sala_id, 
        ad.turno,
        ad.tipo_disciplina,
        ad.dia_semana, 
        ad.data_inicio, 
        ad.data_fim, 
        t.nome as turma_nome,
        d.nome as disciplina_nome,
        p.nome as professor_nome,
        s.nome as sala_nome
      FROM alocacoes_periodo ad
      JOIN turmas t ON ad.turma_id = t.id
      JOIN disciplinas d ON ad.disciplina_id = d.id
      LEFT JOIN professores p ON ad.professor_id = p.id
      JOIN salas s ON ad.sala_id = s.id
      ORDER BY s.nome, ad.dia_semana
    `);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar alocações de disciplinas:", error);
    res.status(500).json({ erro: "Erro ao listar alocações de disciplinas" });
  }
});

// Criar nova alocação de período
router.post("/", async (req, res) => {
  const { turma_id, disciplina_id, professor_id, sala_id, turno, tipo_disciplina, dia_semana, data_inicio, data_fim } = req.body;

  if (!turma_id || !disciplina_id || !sala_id || !tipo_disciplina) {
    return res.status(400).json({ erro: "Campos turma, disciplina, sala e tipo_disciplina são obrigatórios" });
  }

  try {
    const result = await pool.query(
      `INSERT INTO alocacoes_periodo 
       (turma_id, disciplina_id, professor_id, sala_id, turno, tipo_disciplina, dia_semana, data_inicio, data_fim) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [turma_id, disciplina_id, professor_id || null, sala_id, turno || null, tipo_disciplina, dia_semana || null, data_inicio || null, data_fim || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar alocação de período:", err.message);
    res.status(500).json({ erro: "Erro ao criar alocação de período" });
  }
});

// Editar alocação de período
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { turma_id, disciplina_id, professor_id, sala_id, turno, tipo_disciplina, dia_semana, data_inicio, data_fim } = req.body;

  if (!turma_id || !disciplina_id || !sala_id || !tipo_disciplina) {
    return res.status(400).json({ erro: "Campos turma, disciplina, sala e tipo_disciplina são obrigatórios" });
  }

  try {
    const result = await pool.query(
      `UPDATE alocacoes_periodo 
       SET turma_id = $1, disciplina_id = $2, professor_id = $3, sala_id = $4, 
           turno = $5, tipo_disciplina = $6, dia_semana = $7, data_inicio = $8, data_fim = $9 
       WHERE id = $10 
       RETURNING *`,
      [turma_id, disciplina_id, professor_id || null, sala_id, turno || null, tipo_disciplina, dia_semana || null, data_inicio || null, data_fim || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Alocação não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar alocação de período:", err.message);
    res.status(500).json({ erro: "Erro ao editar alocação de período" });
  }
});

// Deletar alocação de período
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM alocacoes_periodo WHERE id = $1", [id]);
    res.json({ mensagem: "Alocação removida" });
  } catch (err) {
    console.error("Erro ao remover alocação:", err.message);
    res.status(500).json({ erro: "Erro ao remover alocação" });
  }
});

module.exports = router;
