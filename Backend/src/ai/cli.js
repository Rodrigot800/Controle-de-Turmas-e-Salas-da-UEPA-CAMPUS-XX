#!/usr/bin/env node
require("dotenv").config();
const readline = require("node:readline/promises");
const { stdin, stdout } = require("node:process");
const pool = require("../db/pool");
const { getConfig } = require("./config");
const { OllamaClient } = require("./ollamaClient");
const { AcademicAgent } = require("./agent");

const config = getConfig();
const flags = new Set(process.argv.slice(2));
const autoApprove = flags.has("--yes");

function compactJson(value) {
  return JSON.stringify(value, null, 2);
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

  const rl = readline.createInterface({ input: stdin, output: stdout });
  const agent = new AcademicAgent({
    ollama,
    db: pool,
    allowWrites: config.allowWrites,
    maxToolRounds: config.maxToolRounds,
    confirmWrite: async ({ name, args }) => {
      console.log(`\nInserção proposta: ${name}`);
      console.log(compactJson(args));
      if (autoApprove) {
        console.log("Confirmada automaticamente por --yes.");
        return true;
      }
      const answer = await rl.question("Confirma esta inserção? [s/N] ");
      return ["s", "sim", "y", "yes"].includes(answer.trim().toLowerCase());
    },
    onEvent: ({ type, name, ok, isWrite, error }) => {
      if (type === "tool_start" && !isWrite) console.log(`  ↳ consultando ${name}...`);
      if (type === "tool_end" && ok === false) console.log(`  ↳ operação não executada: ${error}`);
    },
  });

  console.log("\nAgente acadêmico UniGestão");
  console.log(`Modelo: ${config.model} | Ollama: ${config.ollamaHost}`);
  console.log("Comandos: :ajuda, :limpar, :sair\n");

  try {
    while (true) {
      const input = await rl.question("Você > ");
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
    rl.close();
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
