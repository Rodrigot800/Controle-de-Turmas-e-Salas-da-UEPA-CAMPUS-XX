#!/usr/bin/env node
require("dotenv").config();
const fs = require("node:fs/promises");
const readline = require("node:readline");
const { stdin, stdout } = require("node:process");
const pool = require("../db/pool");
const { runMigrations } = require("../db/migrate");
const { getConfig } = require("./config");
const { OllamaClient } = require("./ollamaClient");
const {
  AcademicAgent,
  isBulkGradeRequest,
  parseBulkGradeIntent,
  parseStructuredGrade,
} = require("./agent");
const {
  parsePlanningPdf,
  parsePlanningPdfWithOllama,
  normalizePastedPlanningText,
} = require("./pdfGradeParser");
const { analyzePlanningDocument } = require("./pdfImportService");
const { importarPlanejamentoSemestre } = require("./tools");

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

  async function collectContinuation(first) {
    const lines = [first];
    const isBulkPaste = /^(?:IMPORTAR\s+GRADE|CURSO\s*:|SEMESTRE\s*:|[A-Z]{2,}\d+\s*\|)/i.test(
      first.trim(),
    );
    const delayMs = isBulkPaste ? 100 : 40;
    const requiredStableChecks = isBulkPaste ? 10 : 2;
    const maxChecks = isBulkPaste ? 50 : 5;
    let previousSize = queue.length;
    let stableChecks = 0;

    for (let attempt = 0; attempt < maxChecks; attempt += 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      if (queue.length === previousSize) {
        stableChecks += 1;
      } else {
        previousSize = queue.length;
        stableChecks = 0;
      }
      if (stableChecks >= requiredStableChecks) break;
    }
    while (queue.length > 0) lines.push(queue.shift());
    return lines.join("\n");
  }

  async function collectPaste(prompt) {
    const first = await next(prompt);
    if (first === null) return null;
    return collectContinuation(first);
  }

  return { next, collectPaste, collectContinuation, close: () => rl.close() };
}

function compactJson(value) {
  return JSON.stringify(value, null, 2);
}

function tokenizeCommand(value) {
  const tokens = [];
  const pattern = /"([^"]*)"|'([^']*)'|(\S+)/g;
  let match;
  while ((match = pattern.exec(value)) !== null) tokens.push(match[1] ?? match[2] ?? match[3]);
  return tokens;
}

function parseRoomAssignments(value) {
  const assignments = {};
  if (!value) return assignments;
  for (const pair of String(value).split(",")) {
    const match = pair.trim().match(/^(\d+)\s*=\s*(.+)$/);
    if (!match) throw new Error(`Mapeamento de sala inválido: '${pair}'. Use período=sala, por exemplo 1=6.`);
    assignments[Number(match[1])] = match[2].trim();
  }
  return assignments;
}

function parsePdfCommand(input) {
  const tokens = tokenizeCommand(input);
  const filePath = tokens[1];
  let rooms = {};
  let ignorePending = false;
  let forceAi = false;
  for (let index = 2; index < tokens.length; index += 1) {
    if (tokens[index] === "--salas") {
      rooms = parseRoomAssignments(tokens[index + 1]);
      index += 1;
    } else if (tokens[index] === "--ignorar-pendentes") {
      ignorePending = true;
    } else if (tokens[index] === "--usar-ia") {
      forceAi = true;
    } else {
      throw new Error(`Opção desconhecida: ${tokens[index]}`);
    }
  }
  return { filePath, rooms, ignorePending, forceAi };
}

function formatPeriods(periods) {
  return periods.map((period) => `${period.inicio}–${period.fim}`).join(", ");
}

function formatWeekdays(days) {
  const labels = ["", "segunda", "terça", "quarta", "quinta", "sexta", "sábado", "domingo"];
  return (days || []).map((day) => labels[day] || day).join(" e ");
}

function printPlanningAnalysis(document, analysis, sourceLabel = "planejamento") {
  console.log(`\nPré-validação do ${sourceLabel}: ${analysis.curso?.nome || document.curso} — ${document.semestre}`);
  console.log(
    `Extrator: ${document.estrategia_extracao === "texto-estruturado"
      ? "linhas estruturadas"
      : document.estrategia_extracao?.startsWith("ollama")
        ? "Ollama (texto flexível)"
        : "tabela detectada"}`,
  );
  console.log(
    `${document.turmas.length} turma(s) | ${analysis.estatisticas?.linhas_fonte ?? document.total_linhas} linha(s) na fonte | ` +
    `${analysis.estatisticas?.importaveis || 0} pronta(s)`,
  );
  for (const grade of analysis.turmas || []) {
    console.log(
      `\n${grade.turma.nome} (#${grade.turma.id}) — ` +
      `${grade.sala ? `${grade.sala.nome} (#${grade.sala.id})` : "SALA PENDENTE"}`,
    );
    for (const item of grade.itens) {
      if (item.estado !== "PRONTO") {
        console.log(`  ⚠ ${item.fonte}: ${item.motivo}`);
        continue;
      }
      console.log(`  ✓ ${item.fonte}`);
      console.log(`    Disciplina: ${item.disciplina}`);
      console.log(`    Docente: ${item.professor}`);
      if (item.carga_horaria_anterior !== undefined) {
        console.log(
          `    Carga horária será corrigida: ${item.carga_horaria_anterior}h → ` +
          `${item.carga_horaria_nova}h`,
        );
      }
      const days = formatWeekdays(item.dias_semana);
      console.log(
        `    ${item.tipo === "SEMANAL" ? "REGULAR (SEMANAL no banco)" : item.tipo}` +
        `${days ? ` | ${days}` : ""} | ${formatPeriods(item.periodos)}`,
      );
    }
  }
  if (analysis.estatisticas) {
    console.log(
      `\nCadastros: ${analysis.estatisticas.disciplinas_existentes} disciplina(s) existente(s), ` +
      `${analysis.estatisticas.disciplinas_novas} nova(s), ` +
      `${analysis.estatisticas.professores_existentes} docente(s) existente(s), ` +
      `${analysis.estatisticas.professores_novos} novo(s).`,
    );
    if (analysis.estatisticas.codigos_a_atualizar > 0) {
      console.log(
        `${analysis.estatisticas.codigos_a_atualizar} disciplina(s) existente(s) receberão o código que consta na fonte.`,
      );
    }
    if (analysis.estatisticas.cargas_horarias_a_atualizar > 0) {
      console.log(
        `${analysis.estatisticas.cargas_horarias_a_atualizar} disciplina(s) terão a carga horária corrigida após a confirmação.`,
      );
    }
  }
  if (analysis.avisos?.length > 0) {
    console.log("\nAvisos:");
    for (const warning of analysis.avisos) console.log(`- ${warning}`);
  }
  if (analysis.pendencias?.length > 0) {
    console.log(`\nPendências${analysis.ignorando_pendencias ? " (serão ignoradas)" : ""}:`);
    for (const issue of analysis.pendencias) console.log(`- ${issue}`);
  }
  if (analysis.erros?.length > 0) {
    console.log("\nErros que bloqueiam a importação:");
    for (const error of analysis.erros) console.log(`- ${error}`);
  }
}

async function handlePdfCommand(input, terminal, ollama) {
  const command = parsePdfCommand(input);
  if (!command.filePath) {
    console.log(
      "Uso: :pdf /imports/arquivo.pdf --salas 1=6,3=7,5=8,6=9,8=10 " +
      "[--ignorar-pendentes] [--usar-ia]\n",
    );
    return;
  }
  console.log(`\nExtraindo e conferindo ${command.filePath}...`);
  const document = await parsePlanningPdf(command.filePath, {
    ollama,
    forceAi: command.forceAi,
  });
  const analysis = await analyzePlanningDocument(pool, document, {
    roomAssignments: command.rooms,
    ignorePending: command.ignorePending,
  });
  printPlanningAnalysis(document, analysis, "PDF");

  if (!analysis.pronto) {
    const hasMissingRooms = analysis.pendencias?.some((issue) => issue.includes("informe a sala"));
    if (hasMissingRooms) {
      console.log(
        "\nNenhum dado foi alterado. Repita o comando informando uma sala para cada período, por exemplo:\n" +
        `:pdf "${command.filePath}" --salas 1=6,3=7,5=8,6=9,8=10` +
        `${analysis.pendencias.length > document.turmas.length ? " --ignorar-pendentes" : ""}\n`,
      );
    } else if (analysis.pendencias?.length > 0 && !command.ignorePending) {
      console.log(
        "\nNenhum dado foi alterado. Resolva as pendências ou repita com --ignorar-pendentes " +
        "para importar somente as linhas completas.\n",
      );
    } else {
      console.log("\nNenhum dado foi alterado. Corrija os erros acima antes de importar.\n");
    }
    return;
  }
  if (!config.allowWrites) {
    console.log("\nA importação está pronta, mas AI_ALLOW_WRITES=false impede a gravação.\n");
    return;
  }

  let approved = autoApprove;
  if (autoApprove) console.log("\nImportação confirmada automaticamente por --yes.");
  else {
    const answer = await terminal.next(
      `\nConfirma a importação atômica de ${analysis.estatisticas.importaveis} disciplina(s)? [s/N] `,
    );
    approved = answer !== null && ["s", "sim", "y", "yes"].includes(answer.trim().toLowerCase());
  }
  if (!approved) {
    console.log("Importação cancelada. Nenhum dado foi inserido.\n");
    return;
  }
  const result = await importarPlanejamentoSemestre(
    analysis.gradesForImport,
    pool,
    { currentYear: config.currentYear },
  );
  console.log(
    `\nImportação concluída: ${result.total_importado} disciplina(s) em ` +
    `${result.total_turmas} turma(s). IDs das importações: ` +
    `${result.importacoes.map((item) => item.importacao_id).join(", ")}.\n`,
  );
}

function pastedPlanningRequirements(intent) {
  const missing = [];
  if (!intent.course) missing.push("CURSO");
  if (!intent.year || !intent.semester) missing.push("SEMESTRE");
  if (!intent.classPeriod) missing.push("TURMA");
  if (!intent.shift) missing.push("TURNO");
  if (intent.roomNumber === null) missing.push("SALA");
  return missing;
}

function structuredPlanningDocument(content, parsed) {
  const { intent, items } = parsed;
  return {
    curso: intent.course,
    campus: "",
    semestre: `${intent.year}.${intent.semester}`,
    turmas: [{
      pagina: 1,
      ano_letivo: intent.year,
      semestre_letivo: intent.semester,
      periodo_turma: intent.classPeriod,
      ...(intent.className ? { turma_nome: intent.className } : {}),
      ...(intent.classStartYear ? { ano_inicio_turma: intent.classStartYear } : {}),
      turno: intent.shift,
      itens: items.map((item) => ({ ...item, pagina: 1, extracao_confiavel: true })),
      pendencias_extracao: [],
      texto_origem: content,
    }],
    total_linhas: items.length,
    estrategia_extracao: "texto-estruturado",
  };
}

async function handlePastedPlanning(content, terminal, ollama) {
  const intent = parseBulkGradeIntent(content, config.currentYear);
  const missing = pastedPlanningRequirements(intent);
  if (missing.length > 0) {
    console.log(
      `\nNão inseri nada. A colagem precisa informar: ${missing.join(", ")}.\n` +
      "Use no início do bloco, por exemplo:\n" +
      "CURSO: Engenharia de Software\nSEMESTRE: 1\n" +
      "TURMA: BES\nTURNO: TARDE\nSALA: 06\n",
    );
    return;
  }

  console.log("\nOrganizando e conferindo o planejamento colado...");
  const parsed = parseStructuredGrade(content, config.currentYear);
  let document;
  if (parsed) {
    document = structuredPlanningDocument(content, parsed);
  } else {
    document = await parsePlanningPdfWithOllama(normalizePastedPlanningText(content), ollama);
    document.curso = intent.course;
    document.estrategia_extracao = "ollama-texto";
    if (document.turmas.length === 1) {
      Object.assign(document.turmas[0], {
        ano_letivo: intent.year,
        semestre_letivo: intent.semester,
        periodo_turma: intent.classPeriod,
        ...(intent.className ? { turma_nome: intent.className } : {}),
        ...(intent.classStartYear ? { ano_inicio_turma: intent.classStartYear } : {}),
        turno: intent.shift,
        texto_origem: content,
      });
      document.semestre = `${intent.year}.${intent.semester}`;
    }
  }

  const roomAssignments = Object.fromEntries(
    document.turmas.map((grade) => [grade.periodo_turma, intent.roomNumber]),
  );
  const analysis = await analyzePlanningDocument(pool, document, { roomAssignments });
  printPlanningAnalysis(document, analysis, "texto colado");
  if (!analysis.pronto) {
    console.log(
      "\nNenhum dado foi alterado. Corrija as pendências indicadas e cole novamente. " +
      "Se o texto do PDF estiver muito embaralhado, organize cada disciplina em uma linha.\n",
    );
    return;
  }
  if (!config.allowWrites) {
    console.log("\nA importação está pronta, mas AI_ALLOW_WRITES=false impede a gravação.\n");
    return;
  }

  let approved = autoApprove;
  if (autoApprove) console.log("\nImportação confirmada automaticamente por --yes.");
  else {
    while (true) {
      const answer = await terminal.next(
        `\nConfirma a importação atômica de ${analysis.estatisticas.importaveis} disciplina(s)? [s/N] `,
      );
      if (answer === null) {
        approved = false;
        break;
      }
      const normalizedAnswer = answer.trim().toLowerCase();
      if (["s", "sim", "y", "yes"].includes(normalizedAnswer)) {
        approved = true;
        break;
      }
      if (["", "n", "não", "nao", "no"].includes(normalizedAnswer)) {
        approved = false;
        break;
      }
      if (/^[A-Z][A-Z0-9]{2,}\s*\|/i.test(answer.trim())) {
        const continuation = await terminal.collectContinuation(answer);
        console.log("\nRecebi mais linha(s) da grade durante a confirmação. Recalculando a prévia...");
        return handlePastedPlanning(`${content.trimEnd()}\n${continuation}`, terminal, ollama);
      }
      console.log("\nResposta inválida. Digite s para confirmar ou n para cancelar.");
    }
  }
  if (!approved) {
    console.log("Importação cancelada. Nenhum dado foi inserido.\n");
    return;
  }
  const result = await importarPlanejamentoSemestre(
    analysis.gradesForImport,
    pool,
    { currentYear: config.currentYear },
  );
  console.log(
    `\nImportação concluída: ${result.total_importado} disciplina(s) em ` +
    `${result.total_turmas} turma(s). IDs das importações: ` +
    `${result.importacoes.map((item) => item.importacao_id).join(", ")}.\n`,
  );
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
  console.log("Comandos: :ajuda, :texto, :pdf, :limpar, :sair — ou cole uma grade diretamente\n");

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
          "- Crie o curso X com 40 vagas, 8 semestres e as disciplinas A (60h) e B (80h).\n" +
          "- Cole uma grade iniciando com CURSO, SEMESTRE (1, 1a ou 2026.1), TURMA (BES ou 1º PERÍODO), TURNO e SALA.\n" +
          "- :texto /app/exemplos/grade_bes_2026_1.txt\n" +
          "- :pdf /imports/grade.pdf\n" +
          "- :pdf /imports/grade.pdf --salas 1=6,3=7,5=8 --ignorar-pendentes\n" +
          "- :pdf /imports/grade.pdf --usar-ia  (força o extrator para layouts diferentes)\n",
        );
        continue;
      }
      if (command === ":texto" || command.startsWith(":texto ")) {
        try {
          await handleTextFileCommand(input.trim(), terminal, ollama);
        } catch (error) {
          console.error(`\nErro no arquivo de texto > ${error.message}\nNenhum dado foi alterado.\n`);
        }
        continue;
      }

      if (command === ":pdf" || command.startsWith(":pdf ")) {
        try {
          await handlePdfCommand(input.trim(), terminal, ollama);
        } catch (error) {
          console.error(`\nErro no PDF > ${error.message}\n`);
        }
        continue;
      }

      if (isBulkGradeRequest(input, config.currentYear)) {
        try {
          await handlePastedPlanning(input, terminal, ollama);
        } catch (error) {
          console.error(`\nErro no texto colado > ${error.message}\nNenhum dado foi alterado.\n`);
        }
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
async function handleTextFileCommand(input, terminal, ollama) {
  const tokens = tokenizeCommand(input);
  const filePath = tokens[1];
  if (!filePath) {
    console.log("Uso: :texto /app/exemplos/grade_bes_2026_1.txt\n");
    return;
  }
  if (tokens.length > 2) throw new Error("O comando :texto aceita apenas o caminho do arquivo.");
  const stats = await fs.stat(filePath);
  if (!stats.isFile()) throw new Error("O caminho informado não é um arquivo.");
  if (stats.size > 1024 * 1024) throw new Error("O arquivo de texto excede o limite de 1 MB.");
  const content = await fs.readFile(filePath, "utf8");
  if (!isBulkGradeRequest(content, config.currentYear)) {
    throw new Error("O arquivo não contém um planejamento acadêmico reconhecível.");
  }
  await handlePastedPlanning(content, terminal, ollama);
}
