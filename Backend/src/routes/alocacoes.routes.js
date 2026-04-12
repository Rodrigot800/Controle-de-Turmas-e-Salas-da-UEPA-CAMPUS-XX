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

router.post("/", async (req, res) => {
  const { turmaId, salaId, turno, timeAlocacao, anoTemp, semestreTemp } =
    req.body;

  try {
    // 1. Turma já alocada
    const turmaExiste = await pool.query(
      "SELECT * FROM alocacoes WHERE turma_id = $1",
      [turmaId],
    );

    if (turmaExiste.rows.length > 0) {
      return res.status(400).json({ erro: "Turma já está alocada" });
    }

    // 2. Buscar dados da turma e curso (IMPORTANTE PARA DEFINITIVO)
    const turma = await pool.query("SELECT * FROM turmas WHERE id = $1", [
      turmaId,
    ]);

    const curso = await pool.query("SELECT * FROM cursos WHERE id = $1", [
      turma.rows[0].curso_id,
    ]);

    const duracao = curso.rows[0].semestres;
    const anoInicio = turma.rows[0].ano_inicio;
    const semestreInicio = turma.rows[0].semestre_inicio;

    // função período
    function periodo(ano, semestre) {
      return ano * 10 + semestre;
    }

    // cálculo fim do curso (definitivo)
    function calcularFim(ano, semestre, duracao) {
      let a = ano;
      let s = semestre;

      for (let i = 1; i < duracao; i++) {
        if (s === 2) {
          s = 1;
          a++;
        } else {
          s = 2;
        }
      }

      return { anoFim: a, semestreFim: s };
    }

    // definir período da NOVA alocação
    let novaInicio, novaFim;

    if (timeAlocacao === "temporario") {
      if (!anoTemp || !semestreTemp) {
        return res.status(400).json({
          erro: "Para temporário, ano e semestre são obrigatórios",
        });
      }

      novaInicio = periodo(anoTemp, semestreTemp);
      novaFim = novaInicio;
    }

    if (timeAlocacao === "definitivo") {
      const fim = calcularFim(anoInicio, semestreInicio, duracao);

      novaInicio = periodo(anoInicio, semestreInicio);
      novaFim = periodo(fim.anoFim, fim.semestreFim);
    }

    // 3. Buscar alocações da sala
    const alocacoes = await pool.query(
      "SELECT * FROM alocacoes WHERE sala_id = $1",
      [salaId],
    );

    // 4. verificar conflito REAL
    for (const a of alocacoes.rows) {
      // ignorar turnos diferentes
      if (a.turno !== turno) continue;

      let existenteInicio, existenteFim;

      if (a.time_alocacao === "temporario") {
        existenteInicio = periodo(a.ano_temp, a.semestre_temp);
        existenteFim = existenteInicio;
      } else {
        const turmaExist = await pool.query(
          "SELECT * FROM turmas WHERE id = $1",
          [a.turma_id],
        );

        const cursoExist = await pool.query(
          "SELECT * FROM cursos WHERE id = $1",
          [turmaExist.rows[0].curso_id],
        );

        const fimExist = calcularFim(
          turmaExist.rows[0].ano_inicio,
          turmaExist.rows[0].semestre_inicio,
          cursoExist.rows[0].semestres,
        );

        existenteInicio = periodo(
          turmaExist.rows[0].ano_inicio,
          turmaExist.rows[0].semestre_inicio,
        );

        existenteFim = periodo(fimExist.anoFim, fimExist.semestreFim);
      }

      const conflito = novaInicio <= existenteFim && existenteInicio <= novaFim;

      if (conflito) {
        return res.status(400).json({
          erro: "Conflito: sala já ocupada nesse período",
        });
      }
    }

    // 5. Inserir
    const result = await pool.query(
      `INSERT INTO alocacoes 
        (turma_id, sala_id, turno, time_alocacao, ano_temp, semestre_temp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`,
      [
        turmaId,
        salaId,
        turno,
        timeAlocacao,
        timeAlocacao === "temporario" ? anoTemp : null,
        timeAlocacao === "temporario" ? semestreTemp : null,
      ],
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Erro ao criar alocacao:", err);
    return res.status(500).json({ erro: err.message });
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
