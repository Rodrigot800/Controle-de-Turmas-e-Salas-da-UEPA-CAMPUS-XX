const pool = require("../db/pool");

class ToolError extends Error {
  constructor(message, details) {
    super(message);
    this.name = "ToolError";
    this.details = details;
  }
}

const ENTITY_CONFIG = {
  cursos: {
    select: "c.id, c.nome, c.vagas, c.semestres",
    from: "cursos c",
    search: ["c.nome"],
    filters: {},
    order: "c.nome",
  },
  salas: {
    select: "s.id, s.nome, s.capacidade, s.piso, s.tipo_sala",
    from: "salas s",
    search: ["s.nome", "s.piso", "s.tipo_sala"],
    filters: {},
    order: "s.nome",
  },
  turmas: {
    select:
      "t.id, t.nome, t.curso_id, c.nome AS curso_nome, t.semestre_inicio, t.ano_inicio, t.turno",
    from: "turmas t JOIN cursos c ON c.id = t.curso_id",
    search: ["t.nome", "c.nome", "t.turno"],
    filters: {
      curso_id: "t.curso_id",
      ano: "t.ano_inicio",
      semestre: "t.semestre_inicio",
      turno: "t.turno",
    },
    order: "t.ano_inicio DESC, t.semestre_inicio DESC, t.nome",
  },
  professores: {
    select:
      "p.id, p.nome, COALESCE(array_agg(DISTINCT c.nome) FILTER (WHERE c.id IS NOT NULL), ARRAY[]::varchar[]) AS cursos",
    from:
      "professores p LEFT JOIN professor_cursos pc ON pc.professor_id = p.id LEFT JOIN cursos c ON c.id = pc.curso_id",
    search: ["p.nome", "c.nome"],
    filters: { curso_id: "pc.curso_id" },
    groupBy: "p.id, p.nome",
    order: "p.nome",
  },
  disciplinas: {
    select: "d.id, d.nome, d.carga_horaria",
    from: "disciplinas d",
    search: ["d.nome"],
    filters: {},
    order: "d.nome",
  },
  curso_disciplinas: {
    select:
      "cd.id, cd.curso_id, c.nome AS curso_nome, cd.disciplina_id, d.nome AS disciplina_nome, d.carga_horaria, cd.semestre_disciplina, cd.disciplina_optativa, cd.disciplina_atual",
    from:
      "curso_disciplinas cd JOIN cursos c ON c.id = cd.curso_id JOIN disciplinas d ON d.id = cd.disciplina_id",
    search: ["c.nome", "d.nome"],
    filters: {
      curso_id: "cd.curso_id",
      disciplina_id: "cd.disciplina_id",
      semestre: "cd.semestre_disciplina",
    },
    order: "c.nome, cd.semestre_disciplina NULLS LAST, d.nome",
  },
  alocacoes: {
    select:
      "a.id, a.turma_id, t.nome AS turma_nome, a.sala_id, s.nome AS sala_nome, a.turno, a.time_alocacao, a.ano_temp, a.semestre_temp",
    from:
      "alocacoes a JOIN turmas t ON t.id = a.turma_id JOIN salas s ON s.id = a.sala_id",
    search: ["t.nome", "s.nome", "a.turno", "a.time_alocacao"],
    filters: {
      turma_id: "a.turma_id",
      sala_id: "a.sala_id",
      ano: "a.ano_temp",
      semestre: "a.semestre_temp",
      turno: "a.turno",
    },
    order: "a.id DESC",
  },
  alocacoes_periodo: {
    select:
      "ap.id, ap.turma_id, t.nome AS turma_nome, ap.disciplina_id, d.nome AS disciplina_nome, ap.professor_id, p.nome AS professor_nome, ap.sala_id, s.nome AS sala_nome, ap.turno, ap.tipo_disciplina, ap.dia_semana, ap.data_inicio, ap.data_fim, ap.reoferta",
    from:
      "alocacoes_periodo ap JOIN turmas t ON t.id = ap.turma_id LEFT JOIN disciplinas d ON d.id = ap.disciplina_id LEFT JOIN professores p ON p.id = ap.professor_id JOIN salas s ON s.id = ap.sala_id",
    search: [
      "t.nome",
      "d.nome",
      "p.nome",
      "s.nome",
      "ap.turno",
      "ap.tipo_disciplina",
    ],
    filters: {
      turma_id: "ap.turma_id",
      sala_id: "ap.sala_id",
      professor_id: "ap.professor_id",
      disciplina_id: "ap.disciplina_id",
      turno: "ap.turno",
    },
    order: "ap.data_inicio DESC NULLS LAST, ap.id DESC",
  },
};

const READ_FILTER_PROPERTIES = {
  busca: { type: "string", description: "Texto parcial para procurar por nome ou descrição." },
  limite: { type: "integer", minimum: 1, maximum: 100, description: "Máximo de registros; padrão 30." },
  curso_id: { type: "integer", minimum: 1 },
  turma_id: { type: "integer", minimum: 1 },
  sala_id: { type: "integer", minimum: 1 },
  professor_id: { type: "integer", minimum: 1 },
  disciplina_id: { type: "integer", minimum: 1 },
  ano: { type: "integer", minimum: 2000, maximum: 2200 },
  semestre: { type: "integer", minimum: 1, maximum: 20 },
  turno: { type: "string" },
};

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "consultar_dados",
      description:
        "Localiza e lista registros acadêmicos com filtros seguros. Use antes de qualquer escrita quando o usuário fornecer nomes em vez de IDs.",
      parameters: {
        type: "object",
        properties: {
          entidade: {
            type: "string",
            enum: Object.keys(ENTITY_CONFIG),
            description: "Conjunto de dados a consultar.",
          },
          ...READ_FILTER_PROPERTIES,
        },
        required: ["entidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "gerar_relatorio",
      description:
        "Executa relatórios agregados ou detalhados: resumo geral, ocupação das salas, carga dos professores, grade de uma turma ou disciplinas de um curso.",
      parameters: {
        type: "object",
        properties: {
          tipo: {
            type: "string",
            enum: [
              "resumo_geral",
              "ocupacao_salas",
              "carga_professores",
              "grade_turma",
              "disciplinas_por_curso",
              "turmas_por_curso",
            ],
          },
          ano: { type: "integer", minimum: 2000, maximum: 2200 },
          semestre: { type: "integer", minimum: 1, maximum: 2 },
          curso_id: { type: "integer", minimum: 1 },
          turma_id: { type: "integer", minimum: 1 },
        },
        required: ["tipo"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_curso",
      description: "Insere um curso novo.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          vagas: { type: "integer", minimum: 1 },
          semestres: { type: "integer", minimum: 1 },
        },
        required: ["nome", "vagas", "semestres"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_sala",
      description: "Insere uma sala nova.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          capacidade: { type: "integer", minimum: 1 },
          piso: { type: "string" },
          tipo_sala: { type: "string" },
        },
        required: ["nome", "capacidade", "piso", "tipo_sala"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_turma",
      description: "Insere uma turma nova vinculada a um curso existente.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          curso_id: { type: "integer", minimum: 1 },
          semestre_inicio: { type: "integer", minimum: 1, maximum: 2 },
          ano_inicio: { type: "integer", minimum: 2000, maximum: 2200 },
          turno: { type: "string" },
        },
        required: ["nome", "curso_id", "semestre_inicio", "ano_inicio", "turno"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_professor",
      description: "Insere um professor e seus vínculos com cursos existentes.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          cursos_ids: { type: "array", items: { type: "integer", minimum: 1 } },
        },
        required: ["nome", "cursos_ids"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_disciplina",
      description: "Insere uma disciplina nova.",
      parameters: {
        type: "object",
        properties: {
          nome: { type: "string" },
          carga_horaria: { type: "integer", minimum: 1 },
        },
        required: ["nome", "carga_horaria"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vincular_disciplina_curso",
      description: "Vincula uma disciplina existente a um curso existente.",
      parameters: {
        type: "object",
        properties: {
          curso_id: { type: "integer", minimum: 1 },
          disciplina_id: { type: "integer", minimum: 1 },
          semestre_disciplina: { type: "integer", minimum: 1 },
          disciplina_optativa: { type: "boolean" },
          disciplina_atual: { type: "boolean" },
        },
        required: ["curso_id", "disciplina_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_alocacao_sala",
      description: "Reserva uma sala para uma turma, validando conflitos de turno e período.",
      parameters: {
        type: "object",
        properties: {
          turma_id: { type: "integer", minimum: 1 },
          sala_id: { type: "integer", minimum: 1 },
          turno: { type: "string" },
          tipo_alocacao: { type: "string", enum: ["temporario", "definitivo"] },
          ano_temporario: { type: "integer", minimum: 2000, maximum: 2200 },
          semestre_temporario: { type: "integer", minimum: 1, maximum: 2 },
        },
        required: ["turma_id", "sala_id", "turno", "tipo_alocacao"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_alocacao_periodo",
      description: "Insere uma oferta/alocação de disciplina para turma, professor, sala e calendário.",
      parameters: {
        type: "object",
        properties: {
          turma_id: { type: "integer", minimum: 1 },
          disciplina_id: { type: "integer", minimum: 1 },
          professor_id: { type: "integer", minimum: 1 },
          sala_id: { type: "integer", minimum: 1 },
          turno: { type: "string" },
          tipo_disciplina: { type: "string", enum: ["SEMANAL", "MODULAR"] },
          dia_semana: { type: "integer", minimum: 1, maximum: 7 },
          data_inicio: { type: "string", description: "Data ISO YYYY-MM-DD." },
          data_fim: { type: "string", description: "Data ISO YYYY-MM-DD." },
          reoferta: { type: "boolean" },
        },
        required: ["turma_id", "sala_id", "tipo_disciplina"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "cadastrar_estrutura_curso",
      description:
        "Cadastro complexo e transacional: cria um curso e, opcionalmente, uma turma e várias disciplinas já vinculadas. Se uma etapa falhar, nada é gravado.",
      parameters: {
        type: "object",
        properties: {
          curso: {
            type: "object",
            properties: {
              nome: { type: "string" },
              vagas: { type: "integer", minimum: 1 },
              semestres: { type: "integer", minimum: 1 },
            },
            required: ["nome", "vagas", "semestres"],
          },
          turma: {
            type: "object",
            properties: {
              nome: { type: "string" },
              semestre_inicio: { type: "integer", minimum: 1, maximum: 2 },
              ano_inicio: { type: "integer", minimum: 2000, maximum: 2200 },
              turno: { type: "string" },
            },
            required: ["nome", "semestre_inicio", "ano_inicio", "turno"],
          },
          disciplinas: {
            type: "array",
            items: {
              type: "object",
              properties: {
                nome: { type: "string" },
                carga_horaria: { type: "integer", minimum: 1 },
                semestre: { type: "integer", minimum: 1 },
                optativa: { type: "boolean" },
              },
              required: ["nome", "carga_horaria"],
            },
          },
        },
        required: ["curso"],
      },
    },
  },
];

const WRITE_TOOLS = new Set(
  toolDefinitions
    .map((tool) => tool.function.name)
    .filter((name) => name.startsWith("cadastrar_") || name.startsWith("vincular_")),
);

function positiveInteger(value, field, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    throw new ToolError(`${field} deve ser um número inteiro entre ${min} e ${max}.`);
  }
  return parsed;
}

function requiredText(value, field) {
  const text = String(value ?? "").trim();
  if (!text) throw new ToolError(`${field} é obrigatório.`);
  return text;
}

function optionalDate(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || Number.isNaN(Date.parse(`${text}T00:00:00Z`))) {
    throw new ToolError(`${field} deve estar no formato YYYY-MM-DD.`);
  }
  return text;
}

async function ensureExists(client, table, id, label) {
  const allowed = new Set(["cursos", "salas", "turmas", "professores", "disciplinas"]);
  if (!allowed.has(table)) throw new Error("Tabela inválida em ensureExists.");
  const result = await client.query(`SELECT id FROM ${table} WHERE id = $1`, [id]);
  if (result.rowCount === 0) throw new ToolError(`${label} com ID ${id} não encontrado(a).`);
}

async function consultarDados(args, db = pool) {
  const config = ENTITY_CONFIG[args.entidade];
  if (!config) throw new ToolError("Entidade de consulta inválida.");

  const values = [];
  const conditions = [];
  if (args.busca) {
    values.push(`%${String(args.busca).trim()}%`);
    conditions.push(`(${config.search.map((column) => `${column} ILIKE $${values.length}`).join(" OR ")})`);
  }

  for (const [filter, column] of Object.entries(config.filters)) {
    if (args[filter] !== undefined && args[filter] !== null && args[filter] !== "") {
      values.push(args[filter]);
      conditions.push(`${column} = $${values.length}`);
    }
  }

  const limit = Math.min(Math.max(Number(args.limite) || 30, 1), 100);
  values.push(limit);
  const sql = `
    SELECT ${config.select}
    FROM ${config.from}
    ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
    ${config.groupBy ? `GROUP BY ${config.groupBy}` : ""}
    ORDER BY ${config.order}
    LIMIT $${values.length}
  `;
  const result = await db.query(sql, values);
  return { entidade: args.entidade, total_retornado: result.rowCount, registros: result.rows };
}

function periodDateRange(ano, semestre) {
  if (ano === undefined && semestre === undefined) return null;
  const year = positiveInteger(ano, "ano", { min: 2000, max: 2200 });
  const term = positiveInteger(semestre, "semestre", { min: 1, max: 2 });
  return term === 1
    ? [`${year}-01-01`, `${year}-06-30`]
    : [`${year}-07-01`, `${year}-12-31`];
}

async function gerarRelatorio(args, db = pool) {
  const range = periodDateRange(args.ano, args.semestre);
  const periodWhere = range ? "WHERE ap.data_inicio BETWEEN $1 AND $2" : "";
  const periodValues = range || [];

  const reports = {
    resumo_geral: {
      sql: `SELECT
        (SELECT COUNT(*)::int FROM cursos) AS cursos,
        (SELECT COUNT(*)::int FROM turmas) AS turmas,
        (SELECT COUNT(*)::int FROM salas) AS salas,
        (SELECT COUNT(*)::int FROM professores) AS professores,
        (SELECT COUNT(*)::int FROM disciplinas) AS disciplinas,
        (SELECT COUNT(*)::int FROM alocacoes) AS alocacoes_sala,
        (SELECT COUNT(*)::int FROM alocacoes_periodo ap ${periodWhere}) AS alocacoes_periodo`,
      values: periodValues,
    },
    ocupacao_salas: {
      sql: `SELECT s.id, s.nome, s.capacidade,
        COUNT(ap.id)::int AS total_alocacoes,
        COUNT(DISTINCT ap.turma_id)::int AS turmas_distintas
        FROM salas s
        LEFT JOIN alocacoes_periodo ap ON ap.sala_id = s.id
          ${range ? "AND ap.data_inicio BETWEEN $1 AND $2" : ""}
        GROUP BY s.id, s.nome, s.capacidade
        ORDER BY total_alocacoes DESC, s.nome`,
      values: periodValues,
    },
    carga_professores: {
      sql: `SELECT p.id, p.nome,
        COUNT(ap.id)::int AS total_alocacoes,
        COUNT(DISTINCT ap.disciplina_id)::int AS disciplinas_distintas,
        COALESCE(SUM(DISTINCT d.carga_horaria), 0)::int AS carga_horaria_distinta
        FROM professores p
        LEFT JOIN alocacoes_periodo ap ON ap.professor_id = p.id
          ${range ? "AND ap.data_inicio BETWEEN $1 AND $2" : ""}
        LEFT JOIN disciplinas d ON d.id = ap.disciplina_id
        GROUP BY p.id, p.nome
        ORDER BY total_alocacoes DESC, p.nome`,
      values: periodValues,
    },
    grade_turma: {
      required: "turma_id",
      sql: `SELECT ap.id, t.nome AS turma, d.nome AS disciplina, p.nome AS professor,
        s.nome AS sala, ap.turno, ap.tipo_disciplina, ap.dia_semana,
        ap.data_inicio, ap.data_fim, ap.reoferta
        FROM alocacoes_periodo ap
        JOIN turmas t ON t.id = ap.turma_id
        LEFT JOIN disciplinas d ON d.id = ap.disciplina_id
        LEFT JOIN professores p ON p.id = ap.professor_id
        JOIN salas s ON s.id = ap.sala_id
        WHERE ap.turma_id = $1
        ORDER BY ap.dia_semana NULLS LAST, ap.data_inicio NULLS LAST, d.nome`,
      values: [args.turma_id],
    },
    disciplinas_por_curso: {
      required: "curso_id",
      sql: `SELECT d.id, d.nome, d.carga_horaria, cd.semestre_disciplina,
        cd.disciplina_optativa, cd.disciplina_atual
        FROM curso_disciplinas cd
        JOIN disciplinas d ON d.id = cd.disciplina_id
        WHERE cd.curso_id = $1
        ORDER BY cd.semestre_disciplina NULLS LAST, d.nome`,
      values: [args.curso_id],
    },
    turmas_por_curso: {
      required: "curso_id",
      sql: `SELECT t.id, t.nome, t.ano_inicio, t.semestre_inicio, t.turno,
        COUNT(ap.id)::int AS alocacoes_periodo
        FROM turmas t LEFT JOIN alocacoes_periodo ap ON ap.turma_id = t.id
        WHERE t.curso_id = $1
        GROUP BY t.id, t.nome, t.ano_inicio, t.semestre_inicio, t.turno
        ORDER BY t.ano_inicio DESC, t.semestre_inicio DESC, t.nome`,
      values: [args.curso_id],
    },
  };

  const report = reports[args.tipo];
  if (!report) throw new ToolError("Tipo de relatório inválido.");
  if (report.required && !args[report.required]) {
    throw new ToolError(`${report.required} é obrigatório para este relatório.`);
  }
  const result = await db.query(report.sql, report.values);
  return { tipo: args.tipo, total_retornado: result.rowCount, dados: result.rows };
}

async function withTransaction(work, db = pool) {
  const client = await db.connect();
  try {
    await client.query("BEGIN");
    const result = await work(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function rejectDuplicateName(client, table, name, label) {
  const allowed = new Set(["cursos", "salas", "professores", "disciplinas"]);
  if (!allowed.has(table)) throw new Error("Tabela inválida em rejectDuplicateName.");
  const result = await client.query(`SELECT id, nome FROM ${table} WHERE LOWER(nome) = LOWER($1)`, [name]);
  if (result.rowCount > 0) {
    throw new ToolError(`${label} '${name}' já existe com ID ${result.rows[0].id}.`);
  }
}

async function cadastrarCurso(args, db = pool) {
  const nome = requiredText(args.nome, "nome");
  const vagas = positiveInteger(args.vagas, "vagas");
  const semestres = positiveInteger(args.semestres, "semestres");
  return withTransaction(async (client) => {
    await rejectDuplicateName(client, "cursos", nome, "Curso");
    const result = await client.query(
      "INSERT INTO cursos (nome, vagas, semestres) VALUES ($1, $2, $3) RETURNING *",
      [nome, vagas, semestres],
    );
    return result.rows[0];
  }, db);
}

async function cadastrarSala(args, db = pool) {
  const nome = requiredText(args.nome, "nome");
  const capacidade = positiveInteger(args.capacidade, "capacidade");
  const piso = requiredText(args.piso, "piso");
  const tipoSala = requiredText(args.tipo_sala, "tipo_sala");
  return withTransaction(async (client) => {
    await rejectDuplicateName(client, "salas", nome, "Sala");
    const result = await client.query(
      "INSERT INTO salas (nome, capacidade, piso, tipo_sala) VALUES ($1, $2, $3, $4) RETURNING *",
      [nome, capacidade, piso, tipoSala],
    );
    return result.rows[0];
  }, db);
}

async function cadastrarTurma(args, db = pool) {
  const nome = requiredText(args.nome, "nome");
  const cursoId = positiveInteger(args.curso_id, "curso_id");
  const semestre = positiveInteger(args.semestre_inicio, "semestre_inicio", { min: 1, max: 2 });
  const ano = positiveInteger(args.ano_inicio, "ano_inicio", { min: 2000, max: 2200 });
  const turno = requiredText(args.turno, "turno");
  return withTransaction(async (client) => {
    await ensureExists(client, "cursos", cursoId, "Curso");
    const duplicate = await client.query(
      "SELECT id FROM turmas WHERE LOWER(nome) = LOWER($1) AND ano_inicio = $2",
      [nome, ano],
    );
    if (duplicate.rowCount > 0) throw new ToolError(`A turma já existe com ID ${duplicate.rows[0].id}.`);
    const result = await client.query(
      `INSERT INTO turmas (nome, curso_id, semestre_inicio, ano_inicio, turno)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [nome, cursoId, semestre, ano, turno],
    );
    return result.rows[0];
  }, db);
}

async function cadastrarProfessor(args, db = pool) {
  const nome = requiredText(args.nome, "nome");
  const cursosIds = [...new Set((args.cursos_ids || []).map((id) => positiveInteger(id, "cursos_ids")))];
  return withTransaction(async (client) => {
    await rejectDuplicateName(client, "professores", nome, "Professor");
    for (const cursoId of cursosIds) await ensureExists(client, "cursos", cursoId, "Curso");
    const result = await client.query("INSERT INTO professores (nome) VALUES ($1) RETURNING *", [nome]);
    for (const cursoId of cursosIds) {
      await client.query(
        "INSERT INTO professor_cursos (professor_id, curso_id) VALUES ($1, $2)",
        [result.rows[0].id, cursoId],
      );
    }
    return { ...result.rows[0], cursos_ids: cursosIds };
  }, db);
}

async function cadastrarDisciplina(args, db = pool) {
  const nome = requiredText(args.nome, "nome");
  const carga = positiveInteger(args.carga_horaria, "carga_horaria");
  return withTransaction(async (client) => {
    await rejectDuplicateName(client, "disciplinas", nome, "Disciplina");
    const result = await client.query(
      "INSERT INTO disciplinas (nome, carga_horaria) VALUES ($1, $2) RETURNING *",
      [nome, carga],
    );
    return result.rows[0];
  }, db);
}

async function vincularDisciplinaCurso(args, db = pool) {
  const cursoId = positiveInteger(args.curso_id, "curso_id");
  const disciplinaId = positiveInteger(args.disciplina_id, "disciplina_id");
  const semestre = args.semestre_disciplina === undefined
    ? null
    : positiveInteger(args.semestre_disciplina, "semestre_disciplina");
  return withTransaction(async (client) => {
    await ensureExists(client, "cursos", cursoId, "Curso");
    await ensureExists(client, "disciplinas", disciplinaId, "Disciplina");
    const duplicate = await client.query(
      "SELECT id FROM curso_disciplinas WHERE curso_id = $1 AND disciplina_id = $2",
      [cursoId, disciplinaId],
    );
    if (duplicate.rowCount > 0) throw new ToolError(`Este vínculo já existe com ID ${duplicate.rows[0].id}.`);
    const result = await client.query(
      `INSERT INTO curso_disciplinas
       (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa, disciplina_atual)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [cursoId, disciplinaId, semestre, args.disciplina_optativa === true, args.disciplina_atual !== false],
    );
    return result.rows[0];
  }, db);
}

function semesterIndex(year, semester) {
  return Number(year) * 2 + Number(semester) - 1;
}

function allocationRange(year, semester, duration) {
  const start = semesterIndex(year, semester);
  return [start, start + Number(duration) - 1];
}

async function cadastrarAlocacaoSala(args, db = pool) {
  const turmaId = positiveInteger(args.turma_id, "turma_id");
  const salaId = positiveInteger(args.sala_id, "sala_id");
  const turno = requiredText(args.turno, "turno");
  const tipo = requiredText(args.tipo_alocacao, "tipo_alocacao").toLowerCase();
  if (!["temporario", "definitivo"].includes(tipo)) throw new ToolError("tipo_alocacao inválido.");

  return withTransaction(async (client) => {
    await ensureExists(client, "salas", salaId, "Sala");
    const turmaResult = await client.query(
      `SELECT t.id, t.ano_inicio, t.semestre_inicio, c.semestres
       FROM turmas t JOIN cursos c ON c.id = t.curso_id WHERE t.id = $1`,
      [turmaId],
    );
    if (turmaResult.rowCount === 0) throw new ToolError(`Turma com ID ${turmaId} não encontrada.`);
    const turma = turmaResult.rows[0];
    let anoTemp = null;
    let semestreTemp = null;
    let requestedRange;
    if (tipo === "temporario") {
      anoTemp = positiveInteger(args.ano_temporario, "ano_temporario", { min: 2000, max: 2200 });
      semestreTemp = positiveInteger(args.semestre_temporario, "semestre_temporario", { min: 1, max: 2 });
      requestedRange = allocationRange(anoTemp, semestreTemp, 1);
    } else {
      requestedRange = allocationRange(turma.ano_inicio, turma.semestre_inicio, turma.semestres);
    }

    const existing = await client.query(
      `SELECT a.id, a.time_alocacao, a.ano_temp, a.semestre_temp,
        t.ano_inicio, t.semestre_inicio, c.semestres
       FROM alocacoes a JOIN turmas t ON t.id = a.turma_id
       JOIN cursos c ON c.id = t.curso_id
       WHERE a.sala_id = $1 AND LOWER(a.turno) = LOWER($2)`,
      [salaId, turno],
    );
    for (const allocation of existing.rows) {
      const currentRange = allocation.time_alocacao === "temporario"
        ? allocationRange(allocation.ano_temp, allocation.semestre_temp, 1)
        : allocationRange(allocation.ano_inicio, allocation.semestre_inicio, allocation.semestres);
      if (requestedRange[0] <= currentRange[1] && currentRange[0] <= requestedRange[1]) {
        throw new ToolError(`Conflito com a alocação ${allocation.id}: a sala já está ocupada nesse turno e período.`);
      }
    }
    const result = await client.query(
      `INSERT INTO alocacoes (turma_id, sala_id, turno, time_alocacao, ano_temp, semestre_temp)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [turmaId, salaId, turno, tipo, anoTemp, semestreTemp],
    );
    return result.rows[0];
  }, db);
}

async function cadastrarAlocacaoPeriodo(args, db = pool) {
  const turmaId = positiveInteger(args.turma_id, "turma_id");
  const salaId = positiveInteger(args.sala_id, "sala_id");
  const disciplinaId = args.disciplina_id == null ? null : positiveInteger(args.disciplina_id, "disciplina_id");
  const professorId = args.professor_id == null ? null : positiveInteger(args.professor_id, "professor_id");
  const tipo = requiredText(args.tipo_disciplina, "tipo_disciplina").toUpperCase();
  if (!["SEMANAL", "MODULAR"].includes(tipo)) throw new ToolError("tipo_disciplina deve ser SEMANAL ou MODULAR.");
  const diaSemana = args.dia_semana == null ? null : positiveInteger(args.dia_semana, "dia_semana", { min: 1, max: 7 });
  const dataInicio = optionalDate(args.data_inicio, "data_inicio");
  const dataFim = optionalDate(args.data_fim, "data_fim");
  if (tipo === "SEMANAL" && !diaSemana) throw new ToolError("dia_semana é obrigatório para disciplina SEMANAL.");
  if (tipo === "MODULAR" && (!dataInicio || !dataFim)) throw new ToolError("data_inicio e data_fim são obrigatórias para disciplina MODULAR.");
  if (dataInicio && dataFim && dataInicio > dataFim) throw new ToolError("data_fim não pode ser anterior a data_inicio.");

  return withTransaction(async (client) => {
    await ensureExists(client, "turmas", turmaId, "Turma");
    await ensureExists(client, "salas", salaId, "Sala");
    if (disciplinaId) await ensureExists(client, "disciplinas", disciplinaId, "Disciplina");
    if (professorId) await ensureExists(client, "professores", professorId, "Professor");
    const result = await client.query(
      `INSERT INTO alocacoes_periodo
       (turma_id, disciplina_id, professor_id, sala_id, turno, tipo_disciplina,
        dia_semana, data_inicio, data_fim, reoferta)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [turmaId, disciplinaId, professorId, salaId, args.turno || null, tipo,
        diaSemana, dataInicio, dataFim, args.reoferta === true],
    );
    return result.rows[0];
  }, db);
}

async function cadastrarEstruturaCurso(args, db = pool) {
  if (!args.curso || typeof args.curso !== "object") throw new ToolError("curso é obrigatório.");
  const curso = {
    nome: requiredText(args.curso.nome, "curso.nome"),
    vagas: positiveInteger(args.curso.vagas, "curso.vagas"),
    semestres: positiveInteger(args.curso.semestres, "curso.semestres"),
  };
  const disciplinas = (args.disciplinas || []).map((item, index) => ({
    nome: requiredText(item.nome, `disciplinas[${index}].nome`),
    carga: positiveInteger(item.carga_horaria, `disciplinas[${index}].carga_horaria`),
    semestre: item.semestre == null ? null : positiveInteger(item.semestre, `disciplinas[${index}].semestre`),
    optativa: item.optativa === true,
  }));

  return withTransaction(async (client) => {
    await rejectDuplicateName(client, "cursos", curso.nome, "Curso");
    const courseResult = await client.query(
      "INSERT INTO cursos (nome, vagas, semestres) VALUES ($1, $2, $3) RETURNING *",
      [curso.nome, curso.vagas, curso.semestres],
    );
    const createdCourse = courseResult.rows[0];
    let createdClass = null;
    if (args.turma) {
      const turma = {
        nome: requiredText(args.turma.nome, "turma.nome"),
        semestre: positiveInteger(args.turma.semestre_inicio, "turma.semestre_inicio", { min: 1, max: 2 }),
        ano: positiveInteger(args.turma.ano_inicio, "turma.ano_inicio", { min: 2000, max: 2200 }),
        turno: requiredText(args.turma.turno, "turma.turno"),
      };
      const classResult = await client.query(
        `INSERT INTO turmas (nome, curso_id, semestre_inicio, ano_inicio, turno)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [turma.nome, createdCourse.id, turma.semestre, turma.ano, turma.turno],
      );
      createdClass = classResult.rows[0];
    }

    const createdSubjects = [];
    for (const subject of disciplinas) {
      const existing = await client.query(
        "SELECT * FROM disciplinas WHERE LOWER(nome) = LOWER($1)",
        [subject.nome],
      );
      let discipline = existing.rows[0];
      let reused = true;
      if (!discipline) {
        const inserted = await client.query(
          "INSERT INTO disciplinas (nome, carga_horaria) VALUES ($1, $2) RETURNING *",
          [subject.nome, subject.carga],
        );
        discipline = inserted.rows[0];
        reused = false;
      }
      const link = await client.query(
        `INSERT INTO curso_disciplinas
         (curso_id, disciplina_id, semestre_disciplina, disciplina_optativa, disciplina_atual)
         VALUES ($1, $2, $3, $4, true) RETURNING *`,
        [createdCourse.id, discipline.id, subject.semestre, subject.optativa],
      );
      createdSubjects.push({ ...discipline, reutilizada: reused, vinculo_id: link.rows[0].id });
    }
    return { curso: createdCourse, turma: createdClass, disciplinas: createdSubjects };
  }, db);
}

const handlers = {
  consultar_dados: consultarDados,
  gerar_relatorio: gerarRelatorio,
  cadastrar_curso: cadastrarCurso,
  cadastrar_sala: cadastrarSala,
  cadastrar_turma: cadastrarTurma,
  cadastrar_professor: cadastrarProfessor,
  cadastrar_disciplina: cadastrarDisciplina,
  vincular_disciplina_curso: vincularDisciplinaCurso,
  cadastrar_alocacao_sala: cadastrarAlocacaoSala,
  cadastrar_alocacao_periodo: cadastrarAlocacaoPeriodo,
  cadastrar_estrutura_curso: cadastrarEstruturaCurso,
};

function friendlyDatabaseError(error) {
  if (error instanceof ToolError) return error;
  if (error.code === "23503") return new ToolError("A operação viola um vínculo: um dos registros relacionados não existe.");
  if (error.code === "23505") return new ToolError("A operação criaria um registro duplicado.");
  if (error.code === "23514") return new ToolError("Um valor não atende às regras do banco de dados.");
  return error;
}

async function executeTool(name, args, db = pool) {
  const handler = handlers[name];
  if (!handler) throw new ToolError(`Ferramenta desconhecida: ${name}.`);
  try {
    return await handler(args || {}, db);
  } catch (error) {
    throw friendlyDatabaseError(error);
  }
}

module.exports = {
  toolDefinitions,
  WRITE_TOOLS,
  ToolError,
  executeTool,
  consultarDados,
  gerarRelatorio,
  positiveInteger,
  optionalDate,
  allocationRange,
};
