const { createSystemPrompt } = require("./systemPrompt");
const { toolDefinitions, WRITE_TOOLS, executeTool, ToolError } = require("./tools");

const KNOWN_TOOLS = new Set(toolDefinitions.map((tool) => tool.function.name));
const TOOL_PARAMETERS = new Map(
  toolDefinitions.map((tool) => [tool.function.name, tool.function.parameters]),
);

function parseToolArguments(value) {
  if (value == null) return {};
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch (_error) {
    throw new ToolError("O modelo enviou argumentos inválidos para a ferramenta.");
  }
}

function publicError(error) {
  if (error instanceof ToolError) return error.message;
  console.error("Erro interno da ferramenta:", error);
  return "Erro interno ao executar a operação no backend.";
}

function missingRequiredArguments(name, args) {
  const schema = TOOL_PARAMETERS.get(name);
  if (!schema) return [];
  return (schema.required || []).filter((field) =>
    args[field] === undefined || args[field] === null || args[field] === "",
  );
}

function collectToolReferences(name, args) {
  const references = [];
  const add = (entity, value, field) => {
    if (value !== undefined && value !== null && value !== "") {
      references.push({ entity, id: Number(value), field });
    }
  };
  const commonAllocation = () => {
    add("turmas", args.turma_id, "turma_id");
    add("disciplinas", args.disciplina_id, "disciplina_id");
    add("professores", args.professor_id, "professor_id");
    add("salas", args.sala_id, "sala_id");
  };

  if (name === "cadastrar_turma") add("cursos", args.curso_id, "curso_id");
  if (name === "cadastrar_professor") {
    for (const id of args.cursos_ids || []) add("cursos", id, "cursos_ids");
  }
  if (name === "vincular_disciplina_curso") {
    add("cursos", args.curso_id, "curso_id");
    add("disciplinas", args.disciplina_id, "disciplina_id");
  }
  if (name === "cadastrar_alocacao_sala") {
    add("turmas", args.turma_id, "turma_id");
    add("salas", args.sala_id, "sala_id");
  }
  if (name === "cadastrar_alocacao_periodo") commonAllocation();
  if (name === "atualizar_alocacao_periodo") {
    add("alocacoes_periodo", args.id, "id");
    commonAllocation();
  }
  if (name === "atualizar_cadastro") {
    const entityMap = {
      curso: "cursos",
      sala: "salas",
      turma: "turmas",
      professor: "professores",
      disciplina: "disciplinas",
    };
    add(entityMap[args.entidade], args.id, "id");
    if (args.entidade === "turma") add("cursos", args.dados?.curso_id, "dados.curso_id");
    if (args.entidade === "professor") {
      for (const id of args.dados?.cursos_ids || []) add("cursos", id, "dados.cursos_ids");
    }
  }
  return references.filter((reference) => reference.entity && Number.isInteger(reference.id));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractContentToolCalls(content) {
  const raw = String(content || "").trim();
  if (!raw) return [];
  const candidates = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.unshift(fenced[1].trim());
  const tagged = raw.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i);
  if (tagged) candidates.unshift(tagged[1].trim());
  const firstBrace = raw.indexOf("{");
  const lastBrace = raw.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    candidates.push(raw.slice(firstBrace, lastBrace + 1));
  }

  for (const candidate of candidates) {
    let parsed;
    try {
      parsed = JSON.parse(candidate);
    } catch (_error) {
      continue;
    }
    const items = Array.isArray(parsed) ? parsed : [parsed];
    const calls = items.map((item) => {
      const fn = item?.function || item;
      const name = fn?.name || item?.tool;
      const args = fn?.arguments ?? item?.arguments ?? item?.parameters ?? {};
      return { function: { name, arguments: args } };
    });
    if (calls.length > 0 && calls.every((call) => KNOWN_TOOLS.has(call.function.name))) {
      return calls;
    }
  }
  return [];
}

class AcademicAgent {
  constructor({
    ollama,
    db,
    allowWrites = true,
    maxToolRounds = 12,
    currentYear = new Date().getFullYear(),
    confirmWrite = async () => false,
    onEvent = () => {},
  }) {
    this.ollama = ollama;
    this.db = db;
    this.allowWrites = allowWrites;
    this.maxToolRounds = maxToolRounds;
    this.currentYear = currentYear;
    this.confirmWrite = confirmWrite;
    this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.messages = [{ role: "system", content: createSystemPrompt(this.currentYear) }];
    this.verifiedRecords = new Map();
  }

  rememberRecords(result) {
    if (!result || !result.entidade || !Array.isArray(result.registros)) return;
    if (!this.verifiedRecords.has(result.entidade)) {
      this.verifiedRecords.set(result.entidade, new Map());
    }
    const records = this.verifiedRecords.get(result.entidade);
    for (const record of result.registros) {
      if (Number.isInteger(Number(record.id))) records.set(Number(record.id), record);
    }
  }

  unverifiedReferences(name, args) {
    return collectToolReferences(name, args).filter((reference) =>
      !this.verifiedRecords.get(reference.entity)?.has(reference.id),
    );
  }

  referenceDetails(name, args) {
    return collectToolReferences(name, args).map((reference) => ({
      campo: reference.field,
      entidade: reference.entity,
      id: reference.id,
      registro: this.verifiedRecords.get(reference.entity)?.get(reference.id),
    }));
  }

  intentMismatch(name, args) {
    if (!["cadastrar_alocacao_periodo", "atualizar_alocacao_periodo"].includes(name)) {
      return null;
    }
    const selected = this.verifiedRecords.get("disciplinas")?.get(Number(args.disciplina_id));
    if (!selected?.nome) return null;

    if (name === "atualizar_alocacao_periodo") {
      const target = this.verifiedRecords.get("alocacoes_periodo")?.get(Number(args.id));
      if (Number(target?.disciplina_id) === Number(args.disciplina_id)) return null;
    }

    const userHistory = normalizeText(
      this.messages
        .filter((message) => message.role === "user")
        .map((message) => message.content)
        .join(" "),
    );
    const selectedName = normalizeText(selected.nome);
    if (selectedName && !userHistory.includes(selectedName)) {
      return `O disciplina_id ${args.disciplina_id} corresponde a '${selected.nome}', mas esse nome não aparece no pedido do usuário. Consulte a disciplina correta ou peça confirmação da opção; não prossiga com este ID.`;
    }
    return null;
  }

  async executeToolCall(toolCall) {
    const fn = toolCall.function || {};
    const name = fn.name;
    const args = parseToolArguments(fn.arguments);
    const isWrite = WRITE_TOOLS.has(name);
    this.onEvent({ type: "tool_start", name, args, isWrite });

    const missing = missingRequiredArguments(name, args);
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Campos obrigatórios ausentes: ${missing.join(", ")}. Consulte os dados necessários e tente novamente.`,
      };
    }
    if (isWrite) {
      const unverified = this.unverifiedReferences(name, args);
      if (unverified.length > 0) {
        const fields = unverified.map(({ field, id }) => `${field}=${id}`).join(", ");
        return {
          ok: false,
          error: `IDs ainda não verificados no backend: ${fields}. Use consultar_dados para cada registro antes de tentar a escrita novamente; não invente IDs.`,
        };
      }
      const mismatch = this.intentMismatch(name, args);
      if (mismatch) return { ok: false, error: mismatch };
    }

    if (isWrite && !this.allowWrites) {
      return { ok: false, error: "As inserções estão desativadas por AI_ALLOW_WRITES=false." };
    }
    if (isWrite) {
      const approved = await this.confirmWrite({
        name,
        args,
        references: this.referenceDetails(name, args),
      });
      if (!approved) {
        return {
          ok: false,
          cancelado: true,
          error: "O usuário recusou esta inserção. Não tente executá-la novamente.",
        };
      }
    }

    try {
      const data = await executeTool(name, args, this.db, { currentYear: this.currentYear });
      if (name === "consultar_dados") this.rememberRecords(data);
      this.onEvent({ type: "tool_end", name, ok: true, data });
      return { ok: true, data };
    } catch (error) {
      const message = publicError(error);
      this.onEvent({ type: "tool_end", name, ok: false, error: message });
      return { ok: false, error: message };
    }
  }

  async ask(userText) {
    const content = String(userText || "").trim();
    if (!content) return "Digite uma pergunta ou solicitação.";
    this.messages.push({ role: "user", content });

    for (let round = 0; round < this.maxToolRounds; round += 1) {
      const response = await this.ollama.chat(this.messages, toolDefinitions);
      const message = response.message;
      if (!message) throw new Error("O Ollama retornou uma resposta sem mensagem.");
      this.messages.push(message);

      const toolCalls = (message.tool_calls && message.tool_calls.length > 0)
        ? message.tool_calls
        : extractContentToolCalls(message.content);
      if (toolCalls.length === 0) {
        const answer = String(message.content || "").trim();
        return answer || "Não consegui formular uma resposta. Tente detalhar o pedido.";
      }

      for (const toolCall of toolCalls) {
        let result;
        try {
          result = await this.executeToolCall(toolCall);
        } catch (error) {
          result = { ok: false, error: publicError(error) };
        }
        const toolMessage = {
          role: "tool",
          tool_name: toolCall.function?.name,
          content: JSON.stringify(result),
        };
        if (toolCall.id) toolMessage.tool_call_id = toolCall.id;
        this.messages.push(toolMessage);
      }
    }

    throw new Error(
      `O agente excedeu ${this.maxToolRounds} rodadas de ferramentas. Reformule o pedido em partes menores.`,
    );
  }
}

module.exports = {
  AcademicAgent,
  parseToolArguments,
  extractContentToolCalls,
  missingRequiredArguments,
  collectToolReferences,
  normalizeText,
};
