const test = require("node:test");
const assert = require("node:assert/strict");
const { getConfig, toBoolean } = require("../src/ai/config");
const {
  AcademicAgent,
  parseToolArguments,
  extractContentToolCalls,
} = require("../src/ai/agent");
const { positiveInteger, optionalDate, allocationRange } = require("../src/ai/tools");

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
});

test("validadores rejeitam inteiros e datas inválidos", () => {
  assert.equal(positiveInteger("2", "semestre", { min: 1, max: 2 }), 2);
  assert.throws(() => positiveInteger(0, "id"), /número inteiro/);
  assert.equal(optionalDate("2026-09-21", "data"), "2026-09-21");
  assert.throws(() => optionalDate("21/09/2026", "data"), /YYYY-MM-DD/);
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
