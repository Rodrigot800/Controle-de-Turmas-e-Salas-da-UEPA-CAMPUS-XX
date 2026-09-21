const DEFAULT_OLLAMA_HOST = "http://127.0.0.1:11434";

function toBoolean(value, fallback) {
  if (value === undefined) return fallback;
  return !["0", "false", "nao", "não", "off"].includes(
    String(value).trim().toLowerCase(),
  );
}

function getConfig(env = process.env) {
  return {
    ollamaHost: (env.OLLAMA_HOST || DEFAULT_OLLAMA_HOST).replace(/\/$/, ""),
    model: env.OLLAMA_MODEL || "qwen2.5-coder:7b",
    temperature: Number(env.AI_TEMPERATURE || 0.1),
    contextSize: Number(env.AI_CONTEXT_SIZE || 8192),
    maxToolRounds: Number(env.AI_MAX_TOOL_ROUNDS || 12),
    allowWrites: toBoolean(env.AI_ALLOW_WRITES, true),
  };
}

module.exports = { getConfig, toBoolean };
