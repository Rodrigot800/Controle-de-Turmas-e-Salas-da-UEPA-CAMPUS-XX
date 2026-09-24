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
  parseSemesterMetadata,
  classMetadata,
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
const {
  classifyByDuration,
  extractWeekdays,
  normalizeAiGrade,
  aiPageCoverageIssue,
  normalizePastedPlanningText,
  parsePlanningPdfWithOllama,
} = require("../src/ai/pdfGradeParser");
const {
  tokenSignature,
  matchNamedRecord,
  analyzePlanningDocument,
} = require("../src/ai/pdfImportService");

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

test("metadados também aceitam campos CURSO, SEMESTRE e SALA sem dois-pontos", () => {
  const source =
    "CURSO: Engenharia de Software\nSEMESTRE 2026.1\n" +
    "TURMA: 1º PERÍODO\nTURNO: TARDE\nSALA 06\n" +
    "COD DISC.DISCIPLINACHDOCENTE\nDMEI1024MATEMÁTICA DISCRETA80GUSTAVO NOGUEIRA DIAS\n" +
    "DENG0769LINGUAGENS FORMAIS80LENO RODRIGUES MARTINS";
  const intent = parseBulkGradeIntent(source);
  assert.equal(intent.course, "Engenharia de Software");
  assert.equal(intent.year, 2026);
  assert.equal(intent.semester, 1);
  assert.equal(intent.classPeriod, 1);
  assert.equal(intent.shift, "TARDE");
  assert.equal(intent.roomNumber, 6);
  assert.equal(isBulkGradeRequest(source), true);
});

test("semestre aceita 1, 1a, 1ª e ano.semestre usando o ano configurado", () => {
  for (const value of ["SEMESTRE: 1", "SEMESTRE: 1a", "SEMESTRE: 1ª", "SEMEstreme: 1"]) {
    assert.deepEqual(parseSemesterMetadata(value, 2026), {
      courseHeading: null,
      year: 2026,
      semester: 1,
    });
  }
  assert.deepEqual(parseSemesterMetadata("SEMESTRE: 2027.2", 2026), {
    courseHeading: null,
    year: 2027,
    semester: 2,
  });
});

test("turma BES usa o ano letivo e BES 25 calcula o período da turma", () => {
  assert.deepEqual(classMetadata("TURMA: BES", 2026, 1), {
    classPeriod: 1,
    className: "BES",
    classStartYear: 2026,
  });
  assert.deepEqual(classMetadata("TURMA: BES 25", 2026, 1), {
    classPeriod: 3,
    className: "BES",
    classStartYear: 2025,
  });
  const intent = parseBulkGradeIntent(
    "CURSO: Engenharia de Software\nSEMESTRE: 1a\nTURMA: BES\nTURNO: TARDE\nSALA: 06",
    2026,
  );
  assert.equal(intent.year, 2026);
  assert.equal(intent.semester, 1);
  assert.equal(intent.classPeriod, 1);
  assert.equal(intent.className, "BES");
  assert.equal(intent.classStartYear, 2026);
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
    tipo_disciplina: "MODULAR",
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
    tipo_disciplina: "MODULAR",
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

test("tipo modular ou regular é determinado por um mês-calendário", () => {
  assert.equal(
    classifyByDuration([{ inicio: "19/02/26", fim: "19/03/26" }]),
    "MODULAR",
  );
  assert.equal(
    classifyByDuration([{ inicio: "19/02/26", fim: "20/03/26" }]),
    "SEMANAL",
  );
  assert.equal(
    classifyByDuration([
      { inicio: "25/03/26", fim: "17/04/26" },
      { inicio: "24/04/26", fim: "29/05/26" },
    ]),
    "SEMANAL",
  );
});

test("texto colado separa datas, cargas e códigos que vieram grudados do PDF", () => {
  const normalized = normalizePastedPlanningText(
    "DMEI1024MATEMÁTICA DISCRETA80GUSTAVO 19/02/2607/03/26DSCI",
  );
  assert.match(normalized, /DMEI1024 MATEMÁTICA DISCRETA 80 GUSTAVO/);
  assert.match(normalized, /19\/02\/26 07\/03\/26 DSCI/);
});

test("validação global rejeita data atribuída mais vezes do que aparece na fonte", () => {
  const issue = aiPageCoverageIssue(
    "DMEI1024 19/02/26 07/03/26 DENG0769 23/03/26 15/06/26",
    [{
      itens: [
        { codigo: "DMEI1024", periodos: [
          { inicio: "19/02/26", fim: "07/03/26" },
          { inicio: "23/03/26", fim: "15/06/26" },
        ] },
        { codigo: "DENG0769", periodos: [
          { inicio: "23/03/26", fim: "15/06/26" },
        ] },
      ],
    }],
  );
  assert.match(issue, /datas usadas mais vezes/);
});

test("dias da semana são preservados sem reduzir uma disciplina com dois dias", () => {
  assert.deepEqual(extractWeekdays("QUARTAS – SEXTAS 20H EAD"), [3, 5]);
  assert.deepEqual(extractWeekdays("SEGUNDAS – 20H EAD"), [1]);
});

test("nomes equivalentes do PDF são relacionados sem criar duplicatas", () => {
  assert.equal(
    tokenSignature("Processos de Desenvolvimento de Software"),
    tokenSignature("Desenvolvimento de Processos de Software"),
  );
  const antonilson = matchNamedRecord(
    "Antonilson da Silva Alcântara",
    [{ id: 11, nome: "ANTONILSON ALCANTARA" }],
    { allowSubset: true },
  );
  assert.equal(antonilson.record.id, 11);
  assert.equal(antonilson.mode, "APROXIMADO");
});

test("pré-validação propõe corrigir carga horária divergente de disciplina inequívoca", async () => {
  const db = {
    query: async (sql) => {
      if (sql.includes("FROM cursos ORDER BY")) {
        return { rows: [{ id: 4, nome: "Engenharia de Software", vagas: 30, semestres: 8 }] };
      }
      if (sql.includes("FROM salas ORDER BY")) {
        return { rows: [{ id: 7, nome: "Sala 6", capacidade: 40, piso: 1, tipo_sala: "Sala" }] };
      }
      if (sql.includes("FROM professores ORDER BY")) {
        return { rows: [{ id: 40, nome: "JAIRO FADUL DE LIMA", lotacao: "DSCI" }] };
      }
      if (sql.includes("FROM turmas WHERE")) {
        return { rows: [{
          id: 29,
          nome: "BES 26",
          curso_id: 4,
          semestre_inicio: 1,
          ano_inicio: 2026,
          turno: "Tarde",
        }] };
      }
      if (sql.includes("FROM disciplinas d")) {
        return { rows: [{
          id: 67,
          codigo: "DENG0770",
          nome: "Programação Estruturada",
          carga_horaria: 80,
          semestre_disciplina: 1,
        }] };
      }
      if (sql.includes("FROM alocacoes_periodo ap")) return { rows: [] };
      throw new Error(`Consulta não simulada: ${sql}`);
    },
  };
  const analysis = await analyzePlanningDocument(db, {
    curso: "Engenharia de Software",
    semestre: "2026.1",
    total_linhas: 1,
    turmas: [{
      ano_letivo: 2026,
      semestre_letivo: 1,
      periodo_turma: 1,
      turma_nome: "BES",
      ano_inicio_turma: 2026,
      turno: "Tarde",
      texto_origem: "DENG0770 Programação Estruturada 60h Jairo Fadul de Lima",
      pendencias_extracao: [],
      itens: [{
        codigo: "DENG0770",
        disciplina: "Programação Estruturada",
        carga_horaria: 60,
        docente: "Jairo Fadul de Lima",
        tipo_disciplina: "MODULAR",
        periodos: [{ inicio: "25/03/26", fim: "17/04/26" }],
      }],
    }],
  }, { roomAssignments: { 1: 6 } });
  assert.equal(analysis.pronto, true);
  assert.equal(analysis.estatisticas.cargas_horarias_a_atualizar, 1);
  assert.equal(analysis.gradesForImport[0].itens[0].corrigir_carga_horaria, true);
  assert.match(analysis.avisos.join(" "), /80h para 60h/);
});

test("extração flexível só aceita valores comprovados no texto da página", () => {
  const source =
    "Curso Engenharia de Software 2026.1 Turma 1º período Tarde " +
    "DMEI1024 Matemática Discreta 80 Gustavo Nogueira Dias 19/02/26 07/03/26";
  const grade = normalizeAiGrade({
    ano_letivo: 2026,
    semestre_letivo: 1,
    periodo_turma: 1,
    turno: "Tarde",
    itens: [{
      codigo: "DMEI1024",
      disciplina: "Matemática Discreta",
      carga_horaria: 80,
      docente: "Gustavo Nogueira Dias",
      periodos: [{ inicio: "19/02/26", fim: "07/03/26" }],
    }],
  }, source, 1);
  assert.equal(grade.itens[0].extracao_confiavel, true);
  assert.equal(grade.itens[0].tipo_disciplina, "MODULAR");

  const unproven = normalizeAiGrade({
    ano_letivo: 2026,
    semestre_letivo: 1,
    periodo_turma: 1,
    turno: "Tarde",
    itens: [{
      disciplina: "Matemática Discreta",
      carga_horaria: 80,
      docente: "Professor Inventado",
      periodos: [{ inicio: "19/02/26", fim: "07/03/26" }],
    }],
  }, source, 1);
  assert.equal(unproven.itens[0].extracao_confiavel, false);
  assert.match(unproven.pendencias_extracao[0].motivo, /confirmação no texto-fonte/);
});

test("fallback do Ollama normaliza layouts sem posições fixas", async () => {
  const ollama = {
    chat: async () => ({
      message: {
        tool_calls: [{
          function: {
            name: "registrar_planejamento_extraido",
            arguments: {
              curso: "Engenharia de Software",
              campus: "XX",
              turmas: [{
                ano_letivo: 2026,
                semestre_letivo: 1,
                periodo_turma: 1,
                turno: "Tarde",
                itens: [{
                  codigo: "DMEI1024",
                  disciplina: "Matemática Discreta",
                  carga_horaria: 80,
                  docente: "Gustavo Nogueira Dias",
                  periodos: [{ inicio: "19/02/26", fim: "07/03/26" }],
                }],
              }],
            },
          },
        }],
      },
    }),
  };
  const result = await parsePlanningPdfWithOllama(
    "DMEI1024 Matemática Discreta 80 Gustavo Nogueira Dias 19/02/26 07/03/26",
    ollama,
  );
  assert.equal(result.estrategia_extracao, "ollama");
  assert.equal(result.turmas[0].itens[0].extracao_confiavel, true);
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
        return { rowCount: 1, rows: [{ id: 2, data_inicio: values[8], data_fim: values[9] }] };
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
