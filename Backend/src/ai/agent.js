const { SYSTEM_PROMPT } = require("./systemPrompt");
const { toolDefinitions, WRITE_TOOLS, executeTool, ToolError } = require("./tools");

const KNOWN_TOOLS = new Set(toolDefinitions.map((tool) => tool.function.name));

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

function extractContentToolCalls(content) {
  const raw = String(content || "").trim();
  if (!raw) return [];
  const candidates = [raw];
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.unshift(fenced[1].trim());
  const tagged = raw.match(/<tool_call>\s*([\s\S]*?)\s*<\/tool_call>/i);
  if (tagged) candidates.unshift(tagged[1].trim());

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
    confirmWrite = async () => false,
    onEvent = () => {},
  }) {
    this.ollama = ollama;
    this.db = db;
    this.allowWrites = allowWrites;
    this.maxToolRounds = maxToolRounds;
    this.confirmWrite = confirmWrite;
    this.onEvent = onEvent;
    this.reset();
  }

  reset() {
    this.messages = [{ role: "system", content: SYSTEM_PROMPT }];
  }

  async executeToolCall(toolCall) {
    const fn = toolCall.function || {};
    const name = fn.name;
    const args = parseToolArguments(fn.arguments);
    const isWrite = WRITE_TOOLS.has(name);
    this.onEvent({ type: "tool_start", name, args, isWrite });

    if (isWrite && !this.allowWrites) {
      return { ok: false, error: "As inserções estão desativadas por AI_ALLOW_WRITES=false." };
    }
    if (isWrite) {
      const approved = await this.confirmWrite({ name, args });
      if (!approved) {
        return {
          ok: false,
          cancelado: true,
          error: "O usuário recusou esta inserção. Não tente executá-la novamente.",
        };
      }
    }

    try {
      const data = await executeTool(name, args, this.db);
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

module.exports = { AcademicAgent, parseToolArguments, extractContentToolCalls };
