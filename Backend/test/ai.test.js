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
        sql.startsWith("SELECT id FROM turmas") ||
        sql.startsWith("SELECT id FROM salas") ||
        sql.startsWith("SELECT id FROM disciplinas")
      ) {
        return { rowCount: 1, rows: [{ id: values[0] }] };
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
