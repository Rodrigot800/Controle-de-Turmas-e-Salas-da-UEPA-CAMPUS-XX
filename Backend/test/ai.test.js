const test = require("node:test");
const assert = require("node:assert/strict");
const { getConfig, toBoolean } = require("../src/ai/config");
const {
  AcademicAgent,
  parseToolArguments,
  extractContentToolCalls,
  missingRequiredArguments,
  collectToolReferences,
  normalizeText,
  isBulkGradeRequest,
  routeToolArguments,
  schemaValidationErrors,
  parseBulkGradeIntent,
  parseStructuredGrade,
  parseStructuredAllocation,
} = require("../src/ai/agent");
const {
  positiveInteger,
  optionalDate,
  normalizeAcademicDate,
  normalizeToolArguments,
  allocationRange,
  executeTool,
} = require("../src/ai/tools");

test("configuração usa o modelo solicitado como padrão", () => {
  const config = getConfig({});
  assert.equal(config.model, "qwen2.5-coder:7b");
  assert.equal(config.ollamaHost, "http://127.0.0.1:11434");
  assert.equal(config.allowWrites, true);
});

test("conversão de booleanos aceita formas negativas", () => {
  assert.equal(toBoolean("false", true), false);
  assert.equal(toBoolean("não", true), false);
  assert.equal(toBoolean("1", false), true);
});

test("argumentos de ferramenta podem vir como objeto ou JSON", () => {
  assert.deepEqual(parseToolArguments({ entidade: "cursos" }), { entidade: "cursos" });
  assert.deepEqual(parseToolArguments('{"entidade":"salas"}'), { entidade: "salas" });
  assert.throws(() => parseToolArguments("{inválido"), /argumentos inválidos/);
});

test("chamada de ferramenta em JSON textual é reconhecida para compatibilidade", () => {
  const calls = extractContentToolCalls(
    '{"name":"gerar_relatorio","arguments":{"tipo":"resumo_geral"}}',
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].function.name, "gerar_relatorio");
  assert.deepEqual(calls[0].function.arguments, { tipo: "resumo_geral" });
  assert.deepEqual(extractContentToolCalls('{"name":"ferramenta_inexistente"}'), []);
  const embedded = extractContentToolCalls(
    'Vou corrigir agora. {"name":"atualizar_alocacao_periodo","arguments":{"id":2,"data_inicio":"11/09"}}',
  );
  assert.equal(embedded[0].function.name, "atualizar_alocacao_periodo");
});

test("campos obrigatórios omitidos pelo modelo são bloqueados antes da escrita", () => {
  assert.deepEqual(
    missingRequiredArguments("atualizar_alocacao_periodo", { id: 2 }),
    ["disciplina_id"],
  );
  assert.deepEqual(
    missingRequiredArguments("atualizar_alocacao_periodo", { id: 2, disciplina_id: 114 }),
    [],
  );
});

test("referências de escrita são identificadas para impedir IDs inventados", () => {
  assert.deepEqual(
    collectToolReferences("atualizar_alocacao_periodo", {
      id: 2,
      disciplina_id: 114,
      professor_id: 77,
    }),
    [
      { entity: "alocacoes_periodo", id: 2, field: "id" },
      { entity: "disciplinas", id: 114, field: "disciplina_id" },
      { entity: "professores", id: 77, field: "professor_id" },
    ],
  );
});

test("comparação de intenção ignora maiúsculas e acentos", () => {
  assert.equal(normalizeText("Inteligência Artificial"), "inteligencia artificial");
});

test("tabela semestral é roteada como importação de grade", () => {
  assert.equal(
    isBulkGradeRequest(
      "Engenharia de Software — 2026.1\nCódigo Disciplina CH\nDMEI1024 Matemática 80\nDENG0769 Linguagens 80\nsemestre 2026.1",
    ),
    true,
  );
  assert.equal(isBulkGradeRequest("Quais disciplinas de Engenharia de Software?"), false);
});

test("busca errada do cabeçalho da grade é redirecionada para cursos", () => {
  assert.deepEqual(
    routeToolArguments(
      "consultar_dados",
      { entidade: "disciplinas", busca: "Engenharia de Software" },
      true,
    ),
    { entidade: "cursos", busca: "Engenharia de Software" },
  );
});

test("limites do esquema são validados antes da confirmação", () => {
  assert.deepEqual(
    schemaValidationErrors("cadastrar_turma", {
      nome: "BES",
      curso_id: 4,
      semestre_inicio: 2026,
      ano_inicio: 2026,
      turno: "Tarde",
    }),
    ["argumentos.semestre_inicio deve ser no máximo 2"],
  );
});

test("metadados do cabeçalho da grade são extraídos deterministicamente", () => {
  const intent = parseBulkGradeIntent(
    "Engenharia de Software — 2026.1\nTurma: 1º período · Turno: Tarde · Sala: 06\nCódigo Disciplina CH Docente\nDMEI1024 Matemática\nDENG0769 Linguagens",
  );
  assert.equal(intent.course, "Engenharia de Software");
  assert.equal(intent.year, 2026);
  assert.equal(intent.semester, 1);
  assert.equal(intent.classPeriod, 1);
  assert.equal(intent.shift, "Tarde");
  assert.equal(intent.roomNumber, 6);
  assert.deepEqual(intent.codes, ["DMEI1024", "DENG0769"]);
});

test("linhas estruturadas da grade são separadas sem depender do modelo", () => {
  const parsed = parseStructuredGrade(
    "Engenharia de Software — 2026.1\nTurma: 1º período · Turno: Tarde · Sala: 06\nCódigo Disciplina CH Docente Período\nDMEI1024 Matemática Discreta 80h Gustavo Nogueira Dias 19/02/26 a 07/03/26\nDENG0769 Linguagens Formais 80h Leno Rodrigues Martins 23/03/26 a 15/06/26",
  );
  assert.equal(parsed.items.length, 2);
  assert.deepEqual(parsed.items[0], {
    codigo: "DMEI1024",
    disciplina: "Matemática Discreta",
    carga_horaria: 80,
    docente: "Gustavo Nogueira Dias",
    tipo_disciplina: "PENDENTE",
    periodos: [{ inicio: "19/02/26", fim: "07/03/26" }],
  });
});

test("grade com uma disciplina e sem código preserva o código como ausente", () => {
  const source =
    "Engenharia de Software — 2026.1\n" +
    "Turma: 1º período · Turno: Tarde · Sala: 06\n" +
    "Disciplina\tCH\tDocente\tPeríodo\n" +
    "Matemática Discreta\t80h\tGustavo Nogueira Dias\t19/02/26 a 07/03/26";
  assert.equal(isBulkGradeRequest(source), true);
  const parsed = parseStructuredGrade(source);
  assert.equal(parsed.items.length, 1);
  assert.deepEqual(parsed.items[0], {
    disciplina: "Matemática Discreta",
    carga_horaria: 80,
    docente: "Gustavo Nogueira Dias",
    tipo_disciplina: "PENDENTE",
    periodos: [{ inicio: "19/02/26", fim: "07/03/26" }],
  });
});

test("pedido completo de alocação é extraído sem perder dados após consultas", () => {
  assert.deepEqual(
    parseStructuredAllocation(
      "Aloque a disciplina Matemática Discreta, com carga horária de 80h, " +
      "ministrada pelo professor Gustavo Nogueira Dias, no período de 19/02/2026 a 07/03/2026, " +
      "em formato modular, na Sala 06, para a turma BES 2026.",
    ),
    {
      disciplina: "Matemática Discreta",
      cargaHoraria: 80,
      docente: "Gustavo Nogueira Dias",
      dataInicio: "19/02/2026",
      dataFim: "07/03/2026",
      tipoDisciplina: "MODULAR",
      salaNumero: 6,
      turmaNome: "BES",
      turmaAno: 2026,
      turno: null,
    },
  );
});

test("alocação aceita 'disciplina de', 'turma de' e carga omitida", () => {
  const parsed = parseStructuredAllocation(
    "Quero alocar a disciplina de Matemática Discreta com o professor Gustavo Nogueira Dias " +
    "no período de 19/02 a 07/03, em formato modular, para a turma de BES 2026 na sala 06.",
  );
  assert.equal(parsed.disciplina, "Matemática Discreta");
  assert.equal(parsed.cargaHoraria, null);
  assert.equal(parsed.docente, "Gustavo Nogueira Dias");
  assert.equal(parsed.turmaNome, "BES");
  assert.equal(parsed.turmaAno, 2026);
  assert.equal(parsed.salaNumero, 6);
});

test("ID de disciplina com nome diferente do pedido é rejeitado", () => {
  const agent = new AcademicAgent({ ollama: {} });
  agent.messages.push({
    role: "user",
    content: "Corrija a disciplina Inteligência Artificial na alocação 2",
  });
  agent.verifiedRecords.set("disciplinas", new Map([
    [1, { id: 1, nome: "Introdução ao Cálculo para Engenharia" }],
  ]));
  agent.verifiedRecords.set("alocacoes_periodo", new Map([
    [2, { id: 2, disciplina_id: null }],
  ]));
  assert.match(
    agent.intentMismatch("atualizar_alocacao_periodo", { id: 2, disciplina_id: 1 }),
    /não aparece no pedido/,
  );
});

test("validadores rejeitam inteiros e datas inválidos", () => {
  assert.equal(positiveInteger("2", "semestre", { min: 1, max: 2 }), 2);
  assert.throws(() => positiveInteger(0, "id"), /número inteiro/);
  assert.equal(optionalDate("2026-09-21", "data"), "2026-09-21");
  assert.throws(() => optionalDate("21/09/2026", "data"), /YYYY-MM-DD/);
  assert.equal(normalizeAcademicDate("11/09", "data", 2026), "2026-09-11");
  assert.equal(normalizeAcademicDate("19/02/26", "data", 2026), "2026-02-19");
  assert.equal(normalizeAcademicDate("12/10/2027", "data", 2026), "2027-10-12");
  assert.throws(() => normalizeAcademicDate("31/02", "data", 2026), /data inexistente/);
  assert.deepEqual(
    normalizeToolArguments(
      "atualizar_alocacao_periodo",
      { id: 2, data_inicio: "11/09", data_fim: "12/10" },
      2026,
    ),
    { id: 2, data_inicio: "2026-09-11", data_fim: "2026-10-12" },
  );
  assert.deepEqual(allocationRange(2026, 2, 4), [4053, 4056]);
});

test("datas de uma grade em lote são normalizadas pelo ano letivo", () => {
  const normalized = normalizeToolArguments(
    "importar_grade_semestre",
    {
      ano_letivo: 2026,
      itens: [{ periodos: [{ inicio: "19/02/26", fim: "07/03/26" }] }],
    },
    2030,
  );
  assert.deepEqual(normalized.itens[0].periodos[0], {
    inicio: "2026-02-19",
    fim: "2026-03-07",
  });
});

test("consulta de disciplina pode ser limitada ao curso da turma", async () => {
  let captured;
  const db = {
    query: async (sql, values) => {
      captured = { sql, values };
      return { rowCount: 0, rows: [] };
    },
  };
  await executeTool(
    "consultar_dados",
    { entidade: "disciplinas", busca: "Matemática Discreta", curso_id: 4 },
    db,
  );
  assert.match(captured.sql, /EXISTS \(\s*SELECT 1 FROM curso_disciplinas/);
  assert.deepEqual(captured.values.slice(0, 2), ["%Matemática Discreta%", 4]);
});

test("alocação bloqueia disciplina que não pertence ao curso da turma", async () => {
  let rolledBack = false;
  const client = {
    query: async (sql, values = []) => {
      if (sql === "ROLLBACK") rolledBack = true;
      if (sql.includes("FROM turmas t JOIN cursos c")) {
        return {
          rowCount: 1,
          rows: [{
            id: 29,
            nome: "BES 26",
            curso_id: 4,
            turno: "Tarde",
            curso_nome: "Engenharia de Software",
          }],
        };
      }
      if (sql.startsWith("SELECT id FROM salas") || sql.startsWith("SELECT id FROM disciplinas")) {
        return { rowCount: 1, rows: [{ id: values[0] }] };
      }
      if (sql.includes("FROM curso_disciplinas")) return { rowCount: 0, rows: [] };
      return { rowCount: 0, rows: [] };
    },
    release: () => {},
  };
  const db = { connect: async () => client };
  await assert.rejects(
    executeTool(
      "cadastrar_alocacao_periodo",
      {
        turma_id: 29,
        disciplina_id: 999,
        sala_id: 7,
        turno: "Tarde",
        tipo_disciplina: "MODULAR",
        data_inicio: "19/02/2026",
        data_fim: "07/03/2026",
      },
      db,
      { currentYear: 2026 },
    ),
    /não está vinculada ao curso 'Engenharia de Software'/,
  );
  assert.equal(rolledBack, true);
});

test("agente executa consulta solicitada pelo modelo e devolve resposta final", async () => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          { function: { name: "consultar_dados", arguments: { entidade: "cursos" } } },
        ],
      },
    },
    { message: { role: "assistant", content: "Há 1 curso: Sistemas de Informação." } },
  ];
  const ollama = { chat: async () => responses.shift() };
  const db = {
    query: async () => ({
      rowCount: 1,
      rows: [{ id: 1, nome: "Sistemas de Informação", vagas: 40, semestres: 8 }],
    }),
  };
  const agent = new AcademicAgent({ ollama, db });
  const answer = await agent.ask("Quais cursos existem?");
  assert.equal(answer, "Há 1 curso: Sistemas de Informação.");
  assert.equal(agent.messages.some((message) => message.role === "tool"), true);
});

test("inserção recusada não chega ao banco", async () => {
  const responses = [
    {
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          {
            function: {
              name: "cadastrar_curso",
              arguments: { nome: "Teste", vagas: 30, semestres: 8 },
            },
          },
        ],
      },
    },
    { message: { role: "assistant", content: "Cadastro cancelado." } },
  ];
  const ollama = { chat: async () => responses.shift() };
  const db = {
    connect: async () => {
      throw new Error("o banco não deveria ser chamado");
    },
  };
  const agent = new AcademicAgent({
    ollama,
    db,
    confirmWrite: async () => false,
  });
  assert.equal(await agent.ask("Cadastre o curso Teste"), "Cadastro cancelado.");
});

test("atualização corrige datas de alocação legada sem criar novo registro", async () => {
  const executed = [];
  const client = {
    query: async (sql, values = []) => {
      executed.push({ sql, values });
      if (sql.startsWith("SELECT * FROM alocacoes_periodo")) {
        return {
          rowCount: 1,
          rows: [{
            id: 2,
            turma_id: 17,
            disciplina_id: null,
            professor_id: null,
            sala_id: 7,
            turno: "Manhã",
            tipo_disciplina: "MODULAR",
            dia_semana: null,
            data_inicio: "2023-11-09",
            data_fim: "2023-11-10",
            reoferta: false,
          }],
        };
      }
      if (
        sql.startsWith("SELECT id FROM salas") ||
        sql.startsWith("SELECT id FROM disciplinas")
      ) {
        return { rowCount: 1, rows: [{ id: values[0] }] };
      }
      if (sql.includes("FROM turmas t JOIN cursos c")) {
        return {
          rowCount: 1,
          rows: [{
            id: 17,
            nome: "BES",
            curso_id: 4,
            turno: "Manhã",
            curso_nome: "Engenharia de Software",
          }],
        };
      }
      if (sql.includes("FROM curso_disciplinas")) {
        return { rowCount: 1, rows: [{ id: 10 }] };
      }
      if (sql.includes("SELECT id FROM alocacoes_periodo") && sql.includes("id <>")) {
        return { rowCount: 0, rows: [] };
      }
      if (sql.includes("UPDATE alocacoes_periodo")) {
        return { rowCount: 1, rows: [{ id: 2, data_inicio: values[7], data_fim: values[8] }] };
      }
      return { rowCount: 0, rows: [] };
    },
    release: () => {},
  };
  const db = { connect: async () => client };
  const result = await executeTool(
    "atualizar_alocacao_periodo",
    { id: 2, disciplina_id: 114, data_inicio: "11/09", data_fim: "12/10" },
    db,
    { currentYear: 2026 },
  );
  assert.equal(result.data_inicio, "2026-09-11");
  assert.equal(result.data_fim, "2026-10-12");
  assert.equal(executed.some(({ sql }) => sql.includes("INSERT INTO alocacoes_periodo")), false);
});
