class OllamaError extends Error {
  constructor(message, cause) {
    super(message);
    this.name = "OllamaError";
    this.cause = cause;
  }
}

async function requestJson(url, options = {}) {
  let response;
  try {
    response = await fetch(url, options);
  } catch (error) {
    throw new OllamaError(
      `Não foi possível conectar ao Ollama em ${url}. Verifique se ele está em execução e se OLLAMA_HOST está correto.`,
      error,
    );
  }

  const text = await response.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch (_error) {
    body = { error: text };
  }

  if (!response.ok) {
    throw new OllamaError(
      body.error || `Ollama respondeu com HTTP ${response.status}.`,
    );
  }

  return body;
}

class OllamaClient {
  constructor({ host, model, temperature = 0.1, contextSize = 8192 }) {
    this.host = host;
    this.model = model;
    this.temperature = temperature;
    this.contextSize = contextSize;
  }

  async listModels() {
    const result = await requestJson(`${this.host}/api/tags`);
    return result.models || [];
  }

  async chat(messages, tools) {
    return requestJson(`${this.host}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        stream: false,
        options: {
          temperature: this.temperature,
          num_ctx: this.contextSize,
        },
      }),
    });
  }
}

module.exports = { OllamaClient, OllamaError };
