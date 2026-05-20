const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ===========================
// Listar todos os professores
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.id,
        p.nome,
        COALESCE(
          json_agg(pc.curso_id) FILTER (WHERE pc.curso_id IS NOT NULL),
          '[]'
        ) as cursos_ids
      FROM professores p
      LEFT JOIN professor_cursos pc ON p.id = pc.professor_id
      GROUP BY p.id, p.nome
      ORDER BY p.nome
    `);

    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao listar professores:", error);
    res.status(500).json({ erro: "Erro ao listar professores" });
  }
});

// ===========================
// Criar novo professor
// ===========================
router.post("/", async (req, res) => {
  const { nome, cursos_ids } = req.body;

  if (!nome || !cursos_ids || !Array.isArray(cursos_ids)) {
    return res
      .status(400)
      .json({ erro: "Campos nome e cursos_ids (array) são obrigatórios" });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO professores (nome) VALUES ($1) RETURNING *",
      [nome]
    );
    const novoProfessor = result.rows[0];

    for (const cursoId of cursos_ids) {
      await client.query(
        "INSERT INTO professor_cursos (professor_id, curso_id) VALUES ($1, $2)",
        [novoProfessor.id, Number(cursoId)]
      );
    }
    
    await client.query("COMMIT");
    
    novoProfessor.cursos_ids = cursos_ids.map(Number);
    res.status(201).json(novoProfessor);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao criar professor:", err.message);
    res.status(500).json({ erro: "Erro ao criar professor" });
  } finally {
    client.release();
  }
});

// ===========================
// Deletar professor por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM professores WHERE id = $1", [id]);
    res.json({ mensagem: "Professor removido" });
  } catch (err) {
    console.error("Erro ao remover professor:", err.message);
    res.status(500).json({ erro: "Erro ao remover professor" });
  }
});

// ===========================
// Editar professor por ID
// ===========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, cursos_ids } = req.body;

  if (!nome || !cursos_ids || !Array.isArray(cursos_ids)) {
    return res.status(400).json({
      erro: "Campos nome e cursos_ids (array) são obrigatórios",
    });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    const result = await client.query(
      `UPDATE professores 
       SET nome = $1
       WHERE id = $2 
       RETURNING *`,
      [nome, id]
    );

    if (result.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ erro: "Professor não encontrado" });
    }

    const professorAtualizado = result.rows[0];

    await client.query("DELETE FROM professor_cursos WHERE professor_id = $1", [id]);

    for (const cursoId of cursos_ids) {
      await client.query(
        "INSERT INTO professor_cursos (professor_id, curso_id) VALUES ($1, $2)",
        [id, Number(cursoId)]
      );
    }

    await client.query("COMMIT");

    professorAtualizado.cursos_ids = cursos_ids.map(Number);
    res.json(professorAtualizado);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao editar professor:", err.message);
    res.status(500).json({ erro: "Erro ao editar professor" });
  } finally {
    client.release();
  }
});

module.exports = router;
