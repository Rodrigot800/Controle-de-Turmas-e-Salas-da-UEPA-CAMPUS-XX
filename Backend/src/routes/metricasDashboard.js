const VALID_TYPES = new Set(["MODULAR", "SEMANAL"]);

function parsePositiveId(value, label) {
  if (value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    const error = new Error(`${label} inválido.`);
    error.status = 400;
    throw error;
  }
  return parsed;
}

function buildFilter(reqQuery) {
  const values = [];
  const clauses = ["ap.data_inicio IS NOT NULL"];
  const add = (sql, value) => {
    values.push(value);
    clauses.push(sql.replace("?", `$${values.length}`));
  };

  let periodo = "";
  if (reqQuery.periodo) {
    const match = String(reqQuery.periodo).trim().match(/^(\d{4})\.([12])$/);
    if (!match) {
      const error = new Error("Período inválido. Use o formato 2026.1 ou 2026.2.");
      error.status = 400;
      throw error;
    }
    periodo = `${match[1]}.${match[2]}`;
    add(
      "COALESCE(ap.ano_letivo, EXTRACT(YEAR FROM ap.data_inicio)::int) = ?",
      Number(match[1]),
    );
    add(
      "COALESCE(ap.semestre_letivo, CASE WHEN EXTRACT(MONTH FROM ap.data_inicio) <= 6 THEN 1 ELSE 2 END) = ?",
      Number(match[2]),
    );
  }

  const cursoId = parsePositiveId(reqQuery.curso_id, "Curso");
  const salaId = parsePositiveId(reqQuery.sala_id, "Sala");
  if (cursoId) add("c.id = ?", cursoId);
  if (salaId) add("s.id = ?", salaId);

  const turno = String(reqQuery.turno || "").trim().toUpperCase();
  if (turno) add("UPPER(BTRIM(ap.turno)) = ?", turno);

  const tipo = String(reqQuery.tipo || "").trim().toUpperCase();
  if (tipo && !VALID_TYPES.has(tipo)) {
    const error = new Error("Tipo de oferta inválido.");
    error.status = 400;
    throw error;
  }
  if (tipo) add("ap.tipo_disciplina = ?", tipo);

  return {
    values,
    where: `WHERE ${clauses.join(" AND ")}`,
    selected: {
      periodo,
      curso_id: cursoId || "",
      turno,
      sala_id: salaId || "",
      tipo,
    },
  };
}

function baseCte(where) {
  return `
    WITH base AS (
      SELECT
        ap.id,
        ap.disciplina_id,
        ap.professor_id,
        ap.turma_id,
        ap.sala_id,
        ap.tipo_disciplina,
        ap.data_inicio,
        ap.data_fim,
        INITCAP(LOWER(BTRIM(ap.turno))) AS turno,
        COALESCE(ap.ano_letivo, EXTRACT(YEAR FROM ap.data_inicio)::int) AS ano_letivo,
        COALESCE(
          ap.semestre_letivo,
          CASE WHEN EXTRACT(MONTH FROM ap.data_inicio) <= 6 THEN 1 ELSE 2 END
        ) AS semestre_letivo,
        d.nome AS disciplina_nome,
        d.carga_horaria,
        p.nome AS professor_nome,
        t.nome AS turma_nome,
        c.id AS curso_id,
        c.nome AS curso_nome,
        s.nome AS sala_nome
      FROM alocacoes_periodo ap
      JOIN disciplinas d ON d.id = ap.disciplina_id
      JOIN professores p ON p.id = ap.professor_id
      JOIN turmas t ON t.id = ap.turma_id
      JOIN cursos c ON c.id = t.curso_id
      LEFT JOIN salas s ON s.id = ap.sala_id
      ${where}
    )
  `;
}

async function loadOptions(pool) {
  const [periodos, cursos, salas, turnos] = await Promise.all([
    pool.query(`
      SELECT DISTINCT
        COALESCE(ano_letivo, EXTRACT(YEAR FROM data_inicio)::int) AS ano,
        COALESCE(
          semestre_letivo,
          CASE WHEN EXTRACT(MONTH FROM data_inicio) <= 6 THEN 1 ELSE 2 END
        ) AS semestre
      FROM alocacoes_periodo
      WHERE data_inicio IS NOT NULL
      ORDER BY ano DESC, semestre DESC
    `),
    pool.query("SELECT id, nome FROM cursos ORDER BY nome"),
    pool.query("SELECT id, nome FROM salas ORDER BY id"),
    pool.query(`
      SELECT DISTINCT INITCAP(LOWER(BTRIM(turno))) AS nome
      FROM alocacoes_periodo
      WHERE NULLIF(BTRIM(turno), '') IS NOT NULL
      ORDER BY nome
    `),
  ]);

  return {
    periodos: periodos.rows.map((item) => `${item.ano}.${item.semestre}`),
    cursos: cursos.rows,
    salas: salas.rows,
    turnos: turnos.rows.map((item) => item.nome),
    tipos: [
      { value: "MODULAR", label: "Modular" },
      { value: "SEMANAL", label: "Regular (semanal)" },
    ],
  };
}

module.exports = function registerMetricsDashboard(router, pool) {
  router.get("/dashboard", async (req, res) => {
    try {
      const filter = buildFilter(req.query);
      const cte = baseCte(filter.where);
      const pendingValues = [...filter.values];
      let pendingCourseFilter = "";
      if (filter.selected.curso_id) {
        pendingValues.push(filter.selected.curso_id);
        pendingCourseFilter = `AND c.id = $${pendingValues.length}`;
      }

      const [
        options,
        summary,
        timeline,
        byCourse,
        byRoom,
        byType,
        byShift,
        teachers,
        pending,
      ] = await Promise.all([
        loadOptions(pool),
        pool.query(`
          ${cte}
          SELECT
            COUNT(*)::int AS ofertas,
            COUNT(DISTINCT disciplina_id)::int AS disciplinas,
            COUNT(DISTINCT turma_id)::int AS turmas,
            COUNT(DISTINCT professor_id)::int AS professores,
            COUNT(DISTINCT sala_id)::int AS salas,
            COALESCE(SUM(carga_horaria), 0)::int AS carga_horaria
          FROM base
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT
            TO_CHAR(DATE_TRUNC('month', data_inicio), 'YYYY-MM') AS mes,
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE tipo_disciplina = 'MODULAR')::int AS modular,
            COUNT(*) FILTER (WHERE tipo_disciplina = 'SEMANAL')::int AS regular
          FROM base
          GROUP BY DATE_TRUNC('month', data_inicio)
          ORDER BY DATE_TRUNC('month', data_inicio)
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT
            curso_id AS id,
            curso_nome AS nome,
            COUNT(*)::int AS ofertas,
            COUNT(DISTINCT turma_id)::int AS turmas,
            COALESCE(SUM(carga_horaria), 0)::int AS carga_horaria
          FROM base
          GROUP BY curso_id, curso_nome
          ORDER BY ofertas DESC, curso_nome
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT
            sala_id AS id,
            COALESCE(sala_nome, 'Sem sala') AS nome,
            COUNT(*)::int AS ofertas,
            COUNT(DISTINCT turma_id)::int AS turmas,
            COALESCE(SUM(carga_horaria), 0)::int AS carga_horaria
          FROM base
          GROUP BY sala_id, sala_nome
          ORDER BY ofertas DESC, nome
          LIMIT 10
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT tipo_disciplina AS nome, COUNT(*)::int AS quantidade
          FROM base
          GROUP BY tipo_disciplina
          ORDER BY quantidade DESC
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT turno AS nome, COUNT(*)::int AS quantidade
          FROM base
          GROUP BY turno
          ORDER BY quantidade DESC
        `, filter.values),
        pool.query(`
          ${cte}
          SELECT
            professor_id AS id,
            professor_nome AS nome,
            COUNT(*)::int AS ofertas,
            COUNT(DISTINCT disciplina_id)::int AS disciplinas,
            COUNT(DISTINCT turma_id)::int AS turmas,
            COALESCE(SUM(carga_horaria), 0)::int AS carga_horaria
          FROM base
          GROUP BY professor_id, professor_nome
          ORDER BY ofertas DESC, carga_horaria DESC, professor_nome
          LIMIT 12
        `, filter.values),
        pool.query(`
          ${cte},
          ofertadas AS (
            SELECT DISTINCT curso_id, disciplina_id
            FROM base
          )
          SELECT
            c.id AS curso_id,
            c.nome AS curso_nome,
            COUNT(cd.disciplina_id)::int AS quantidade
          FROM curso_disciplinas cd
          JOIN cursos c ON c.id = cd.curso_id
          LEFT JOIN ofertadas o
            ON o.curso_id = cd.curso_id
            AND o.disciplina_id = cd.disciplina_id
          WHERE cd.disciplina_atual IS DISTINCT FROM FALSE
            AND o.disciplina_id IS NULL
            ${pendingCourseFilter}
          GROUP BY c.id, c.nome
          HAVING COUNT(cd.disciplina_id) > 0
          ORDER BY quantidade DESC, c.nome
        `, pendingValues),
      ]);

      res.json({
        filtros: filter.selected,
        opcoes: options,
        resumo: summary.rows[0],
        ofertasPorMes: timeline.rows,
        ofertasPorCurso: byCourse.rows,
        usoPorSala: byRoom.rows,
        distribuicaoTipo: byType.rows,
        distribuicaoTurno: byShift.rows,
        professores: teachers.rows,
        disciplinasSemOferta: pending.rows,
        atualizadoEm: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erro ao montar dashboard de métricas:", error);
      res.status(error.status || 500).json({
        error: error.status ? error.message : "Erro interno ao montar métricas",
      });
    }
  });
};
