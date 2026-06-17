const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// GET /metricas/periodos
// Retorna os períodos disponíveis (ano_inicio.semestre_inicio)
router.get("/periodos", async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ano_inicio, semestre_inicio
      FROM turmas
      WHERE ano_inicio IS NOT NULL AND semestre_inicio IS NOT NULL
      ORDER BY ano_inicio DESC, semestre_inicio DESC;
    `;
    const result = await pool.query(query);
    const periodos = result.rows.map(r => `${r.ano_inicio}.${r.semestre_inicio}`);
    res.json(periodos);
  } catch (error) {
    console.error("Erro ao buscar períodos:", error);
    res.status(500).json({ error: "Erro interno ao buscar períodos" });
  }
});

// Helper para montar o filtro de período
const getFiltroPeriodo = (periodo, prefixTurma = '') => {
  if (!periodo) return { str: '', vals: [] };
  const [ano, sem] = periodo.split('.');
  if (!ano || !sem) return { str: '', vals: [] };
  
  const prefix = prefixTurma ? `${prefixTurma}.` : '';
  return {
    str: `WHERE ${prefix}ano_inicio = $1 AND ${prefix}semestre_inicio = $2`,
    vals: [parseInt(ano), parseInt(sem)]
  };
};

// Helper para montar o filtro de período baseado em data_inicio (para alocacoes_periodo)
const getFiltroPeriodoData = (periodo, prefix = 'ap') => {
  if (!periodo) return { str: '', vals: [] };
  const [ano, sem] = periodo.split('.');
  if (!ano || !sem) return { str: '', vals: [] };
  
  const anoNum = parseInt(ano);
  const dataInicio = sem === '1' ? `${anoNum}-01-01` : `${anoNum}-07-01`;
  const dataFim = sem === '1' ? `${anoNum}-06-30` : `${anoNum}-12-31`;

  return {
    str: `WHERE ${prefix}.data_inicio >= $1 AND ${prefix}.data_inicio <= $2`,
    vals: [dataInicio, dataFim]
  };
};

// GET /metricas/resumo
router.get("/resumo", async (req, res) => {
  const { periodo } = req.query;
  const filtro = getFiltroPeriodo(periodo);
  const filtroT = getFiltroPeriodo(periodo, 't');
  const filtroData = getFiltroPeriodoData(periodo, 'ap');

  try {
    // 1. Total de turmas
    const turmasQuery = `SELECT COUNT(*) FROM turmas ${filtro.str}`;
    const turmasResult = await pool.query(turmasQuery, filtro.vals);
    const totalTurmas = parseInt(turmasResult.rows[0].count);

    // 2. Total de disciplinas do campus (cadastradas no sistema)
    const disciplinasResult = await pool.query("SELECT COUNT(*) FROM disciplinas");
    const totalDisciplinas = parseInt(disciplinasResult.rows[0].count);

    // 3. Disciplinas ministradas atualmente (únicas em alocacoes_periodo)
    const disciplinasQuery = `
      SELECT COUNT(DISTINCT ap.disciplina_id) 
      FROM alocacoes_periodo ap
      ${filtroData.str}
    `;
    const disciplinasMinistradasResult = await pool.query(disciplinasQuery, filtroData.vals);
    const disciplinasMinistradas = parseInt(disciplinasMinistradasResult.rows[0].count);

    // 4. Total de cursos (geral, não filtra por semestre)
    const cursosResult = await pool.query("SELECT COUNT(*) FROM cursos");
    const totalCursos = parseInt(cursosResult.rows[0].count);

    // 5. Total de professores com alocação
    const professoresQuery = `
      SELECT COUNT(DISTINCT ap.professor_id) 
      FROM alocacoes_periodo ap
      ${filtroData.str}
    `;
    const professoresAtivosResult = await pool.query(professoresQuery, filtroData.vals);
    const professoresAtivos = parseInt(professoresAtivosResult.rows[0].count);

    res.json({
      totalTurmas,
      totalDisciplinas,
      disciplinasMinistradas,
      totalCursos,
      professoresAtivos
    });
  } catch (error) {
    console.error("Erro ao buscar resumo das métricas:", error);
    res.status(500).json({ error: "Erro interno ao buscar resumo" });
  }
});

// GET /metricas/professores-destaque
// Traz qual professor que ministrou mais disciplinas em cada curso
router.get("/professores-destaque", async (req, res) => {
  const { periodo } = req.query;
  const filtroData = getFiltroPeriodoData(periodo, 'ap');

  try {
    const query = `
      WITH contagem AS (
          SELECT 
              c.nome AS curso_nome,
              p.nome AS professor_nome,
              COUNT(ap.disciplina_id) AS total_disciplinas,
              ROW_NUMBER() OVER(PARTITION BY c.id ORDER BY COUNT(ap.disciplina_id) DESC) as rn
          FROM alocacoes_periodo ap
          JOIN turmas t ON ap.turma_id = t.id
          JOIN cursos c ON t.curso_id = c.id
          JOIN professores p ON ap.professor_id = p.id
          ${filtroData.str}
          GROUP BY c.id, c.nome, p.id, p.nome
      )
      SELECT curso_nome, professor_nome, total_disciplinas
      FROM contagem
      WHERE rn = 1
      ORDER BY curso_nome;
    `;
    const result = await pool.query(query, filtroData.vals);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar professores destaque:", error);
    res.status(500).json({ error: "Erro interno ao buscar professores destaque" });
  }
});

// GET /metricas/disciplinas-nao-ministradas
// Quantas disciplinas não foram ministradas de cada curso e total
router.get("/disciplinas-nao-ministradas", async (req, res) => {
  const { periodo } = req.query;
  const filtroData = getFiltroPeriodoData(periodo, 'ap');
  
  try {
    const query = `
      SELECT 
          c.nome AS curso_nome,
          COUNT(cd.disciplina_id) AS total_nao_ministradas
      FROM curso_disciplinas cd
      JOIN cursos c ON cd.curso_id = c.id
      LEFT JOIN (
          SELECT DISTINCT ap.disciplina_id, t.curso_id
          FROM alocacoes_periodo ap
          JOIN turmas t ON ap.turma_id = t.id
          ${filtroData.str}
      ) alocadas ON cd.disciplina_id = alocadas.disciplina_id AND cd.curso_id = alocadas.curso_id
      WHERE alocadas.disciplina_id IS NULL
      GROUP BY c.nome
      ORDER BY total_nao_ministradas DESC;
    `;
    const result = await pool.query(query, filtroData.vals);

    // Calcular o total geral
    const totalGeral = result.rows.reduce((acc, row) => acc + parseInt(row.total_nao_ministradas), 0);

    res.json({
      detalhes: result.rows,
      totalGeral
    });
  } catch (error) {
    console.error("Erro ao buscar disciplinas não ministradas:", error);
    res.status(500).json({ error: "Erro interno ao buscar disciplinas não ministradas" });
  }
});

// GET /metricas/turnos
// Quantidade de turmas (com alocação) por turno
router.get("/turnos", async (req, res) => {
  const { periodo } = req.query;
  const filtroData = getFiltroPeriodoData(periodo, 'ap');

  try {
    const query = `
      SELECT 
        INITCAP(LOWER(ap.turno)) AS turno, 
        COUNT(DISTINCT ap.turma_id) AS quantidade
      FROM alocacoes_periodo ap
      ${filtroData.str}
      GROUP BY INITCAP(LOWER(ap.turno))
      ORDER BY quantidade DESC;
    `;
    const result = await pool.query(query, filtroData.vals);
    res.json(result.rows);
  } catch (error) {
    console.error("Erro ao buscar distribuição por turnos:", error);
    res.status(500).json({ error: "Erro interno ao buscar turnos" });
  }
});

module.exports = router;
