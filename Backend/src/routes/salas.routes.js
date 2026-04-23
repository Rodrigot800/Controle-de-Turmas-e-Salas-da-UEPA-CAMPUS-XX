const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// ===========================
// Listar todos as salas
// ===========================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        nome,
        capacidade,
        piso,
        tipo_sala as "tipoSala"
      FROM salas
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("Erro ao listar cursos:", err.message);
    res.status(500).json({ erro: "Erro ao listar cursos" });
  }
});

// ===========================
// Criar novo sala
// ===========================
router.post("/", async (req, res) => {
  const { nome, piso , capacidade, tipoSala} = req.body;

  if (!nome || !piso || !capacidade || !tipoSala) {
    return res
      .status(400)
      .json({
        erro: "Campos nome, vagas, piso e capacidade são obrigatórios",
      });
  }

  try {
    const result = await pool.query(
      `INSERT INTO salas (nome, piso, capacidade, tipo_sala) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, nome, piso, capacidade, tipo_sala as "tipoSala"`,
      [nome, piso, Number(capacidade), tipoSala],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar sala:", err.message);
    res.status(500).json({ erro: "Erro ao criar sala" });
  }
});

// ===========================
// Editar sala por ID
// ===========================
router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, piso, capacidade, tipoSala } = req.body;

  if (!nome || !piso || !capacidade || !tipoSala) {
    return res.status(400).json({
      erro: "Campos nome, piso, capacidade e tipoSala são obrigatórios",
    });
  }

  try {
    const result = await pool.query(
      `UPDATE salas 
       SET nome = $1, piso = $2, capacidade = $3, tipo_sala = $4 
       WHERE id = $5 
       RETURNING id, nome, piso, capacidade, tipo_sala as "tipoSala"`,
      [nome, piso, Number(capacidade), tipoSala, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ erro: "Sala não encontrada" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao editar sala:", err.message);
    res.status(500).json({ erro: "Erro ao editar sala" });
  }
});

// ===========================
// Deletar sala por ID
// ===========================
router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM salas WHERE id = $1", [id]);
    res.json({ mensagem: "Sala removida" });
  } catch (err) {
    console.error("Erro ao remover sala:", err.message);
    res.status(500).json({ erro: "Erro ao remover sala" });
  }
});

module.exports = router;
