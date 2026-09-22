#!/usr/bin/env node
require("dotenv").config();
const readline = require("node:readline");
const { stdin, stdout } = require("node:process");
const pool = require("../db/pool");
const { runMigrations } = require("../db/migrate");
const { getConfig } = require("./config");
const { OllamaClient } = require("./ollamaClient");
const { AcademicAgent } = require("./agent");

const config = getConfig();
const flags = new Set(process.argv.slice(2));
const autoApprove = flags.has("--yes");

function createTerminalInput(input, output) {
  const rl = readline.createInterface({ input, output, terminal: true });
  const queue = [];
  const waiters = [];
  let closed = false;

  rl.on("line", (line) => {
    const waiter = waiters.shift();
    if (waiter) waiter(line);
    else queue.push(line);
  });
  rl.on("close", () => {
    closed = true;
    while (waiters.length > 0) waiters.shift()(null);
  });

  async function next(prompt) {
    output.write(prompt);
    if (queue.length > 0) return queue.shift();
    if (closed) return null;
    return new Promise((resolve) => waiters.push(resolve));
  }

  async function collectPaste(prompt) {
    const first = await next(prompt);
    if (first === null) return null;
    const lines = [first];
    let previousSize = -1;
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, 60));
      if (queue.length === previousSize) break;
      previousSize = queue.length;
    }
    while (queue.length > 0) lines.push(queue.shift());
    return lines.join("\n");
  }

  return { next, collectPaste, close: () => rl.close() };
}

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function printWritePreview(name, args) {
  if (name !== "importar_grade_semestre") {
    console.log(compactJson(args));
    return;
  }
  const classLabel = args.turma_id
    ? `turma #${args.turma_id}`
    : `NOVA turma ${args.nova_turma?.nome || "?"} ` +
      `(curso #${args.nova_turma?.curso_id || "?"}, ` +
      `${args.nova_turma?.ano_inicio}.${args.nova_turma?.semestre_inicio})`;
  console.log(
    `Semestre ${args.ano_letivo}.${args.semestre_letivo} | ` +
    `${classLabel} (${args.periodo_turma}º período) | ` +
    `turno ${args.turno} | ${args.itens?.length || 0} disciplina(s)`,
  );
  for (const [index, item] of (args.itens || []).entries()) {
    const periods = (item.periodos || [])
      .map((period) => `${period.inicio}–${period.fim}`)
      .join(", ");
    console.log(
      `${index + 1}. ${item.codigo || "SEM CÓDIGO"} — ${item.disciplina} (${item.carga_horaria}h)\n` +
      `   Docente: ${item.docente || "PENDENTE"}` +
      `${item.lotacao_docente ? ` [${item.lotacao_docente}]` : ""} | ` +
      `Sala: ${item.sala_id || args.sala_id || "PENDENTE"} | ${item.tipo_disciplina}\n` +
      `   Períodos: ${periods}${item.observacao ? ` | ${item.observacao}` : ""}`,
    );
  }
}

async function checkDependencies(ollama) {
  const checks = { banco: false, ollama: false, modelo: false };
  try {
    await pool.query("SELECT 1");
    checks.banco = true;
    console.log("✓ PostgreSQL conectado");
  } catch (error) {
    console.error(`✗ PostgreSQL: ${error.message}`);
  }

  try {
    const models = await ollama.listModels();
    checks.ollama = true;
    checks.modelo = models.some(
      (item) => item.name === config.model || item.model === config.model,
    );
    console.log(`✓ Ollama conectado em ${config.ollamaHost}`);
    if (checks.modelo) console.log(`✓ Modelo ${config.model} disponível`);
    else console.error(`✗ Modelo ${config.model} não encontrado. Execute: ollama pull ${config.model}`);
  } catch (error) {
    console.error(`✗ Ollama: ${error.message}`);
  }
  return Object.values(checks).every(Boolean);
}

async function main() {
  await runMigrations(pool);
  const ollama = new OllamaClient({
    host: config.ollamaHost,
    model: config.model,
    temperature: config.temperature,
    contextSize: config.contextSize,
  });

  if (flags.has("--check")) {
    const healthy = await checkDependencies(ollama);
    await pool.end();
    process.exitCode = healthy ? 0 : 1;
    return;
  }

  const terminal = createTerminalInput(stdin, stdout);
  const agent = new AcademicAgent({
    ollama,
    db: pool,
    allowWrites: config.allowWrites,
    maxToolRounds: config.maxToolRounds,
    currentYear: config.currentYear,
    confirmWrite: async ({ name, args, references }) => {
      const action = name.startsWith("atualizar_") ? "Alteração" : "Inserção";
      console.log(`\n${action} proposta: ${name}`);
      printWritePreview(name, args);
      if (references.length > 0) {
        console.log("Referências verificadas no backend:");
        for (const reference of references) {
          const label = reference.registro?.nome ||
            reference.registro?.disciplina_nome ||
            reference.registro?.turma_nome ||
            `registro ${reference.id}`;
          console.log(`- ${reference.campo}: ${label} (${reference.entidade} #${reference.id})`);
        }
      }
      if (autoApprove) {
        console.log("Confirmada automaticamente por --yes.");
        return true;
      }
      const answer = await terminal.next(`Confirma esta ${action.toLowerCase()}? [s/N] `);
      if (answer === null) return false;
      return ["s", "sim", "y", "yes"].includes(answer.trim().toLowerCase());
    },
    onEvent: ({ type, name, args, ok, isWrite, error }) => {
      if (type === "tool_start" && !isWrite) {
        const target = name === "consultar_dados"
          ? ` ${args.entidade}${args.busca ? ` por "${args.busca}"` : ""}`
          : "";
        console.log(`  ↳ consultando ${name}${target}...`);
      }
      if (type === "tool_end" && ok === false) console.log(`  ↳ operação não executada: ${error}`);
    },
  });

  console.log("\nAgente acadêmico UniGestão");
  console.log(`Modelo: ${config.model} | Ollama: ${config.ollamaHost}`);
  console.log("Comandos: :ajuda, :limpar, :sair\n");

  try {
    while (true) {
      const input = await terminal.collectPaste("Você > ");
      if (input === null) break;
      const command = input.trim().toLowerCase();
      if (!command) continue;
      if ([":sair", ":exit", ":q"].includes(command)) break;
      if (command === ":limpar") {
        agent.reset();
        console.log("Contexto da conversa apagado.\n");
        continue;
      }
      if (command === ":ajuda") {
        console.log(
          "Exemplos:\n" +
          "- Quantas salas existem e quais têm capacidade acima de 40?\n" +
          "- Liste a grade da turma X.\n" +
          "- Cadastre uma sala chamada Lab 4, capacidade 35, piso térreo, tipo laboratório.\n" +
          "- Crie o curso X com 40 vagas, 8 semestres e as disciplinas A (60h) e B (80h).\n",
        );
        continue;
      }

      try {
        const answer = await agent.ask(input);
        console.log(`\nAgente > ${answer}\n`);
      } catch (error) {
        console.error(`\nErro > ${error.message}\n`);
      }
    }
  } finally {
    terminal.close();
    await pool.end();
  }
}

main().catch(async (error) => {
  console.error(`Falha ao iniciar o agente: ${error.message}`);
  try {
    await pool.end();
  } catch (_error) {
    // O pool pode não ter sido inicializado completamente.
  }
  process.exitCode = 1;
});
