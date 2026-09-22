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

function schemaValidationErrors(name, args) {
  const schema = TOOL_PARAMETERS.get(name);
  const errors = [];
  const validate = (definition, value, path) => {
    if (value === undefined || value === null) return;
    if (definition.type === "object") {
      if (typeof value !== "object" || Array.isArray(value)) {
        errors.push(`${path} deve ser um objeto`);
        return;
      }
      for (const required of definition.required || []) {
        if (value[required] === undefined || value[required] === null || value[required] === "") {
          errors.push(`${path}.${required} é obrigatório`);
        }
      }
      for (const [field, child] of Object.entries(definition.properties || {})) {
        if (value[field] !== undefined) validate(child, value[field], `${path}.${field}`);
      }
      return;
    }
    if (definition.type === "array") {
      if (!Array.isArray(value)) {
        errors.push(`${path} deve ser uma lista`);
        return;
      }
      if (definition.minItems && value.length < definition.minItems) {
        errors.push(`${path} deve ter ao menos ${definition.minItems} item(ns)`);
      }
      value.forEach((item, index) => validate(definition.items || {}, item, `${path}[${index}]`));
      return;
    }
    if (definition.type === "integer") {
      const number = Number(value);
      if (!Number.isInteger(number)) errors.push(`${path} deve ser inteiro`);
      else {
        if (definition.minimum !== undefined && number < definition.minimum) {
          errors.push(`${path} deve ser no mínimo ${definition.minimum}`);
        }
        if (definition.maximum !== undefined && number > definition.maximum) {
          errors.push(`${path} deve ser no máximo ${definition.maximum}`);
        }
      }
    }
    if (definition.type === "string" && typeof value !== "string") {
      errors.push(`${path} deve ser texto`);
    }
    if (definition.type === "boolean" && typeof value !== "boolean") {
      errors.push(`${path} deve ser verdadeiro ou falso`);
    }
    if (definition.enum && !definition.enum.includes(value)) {
      errors.push(`${path} deve ser um de: ${definition.enum.join(", ")}`);
    }
  };
  validate(schema, args, "argumentos");
  return errors;
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
  if (name === "importar_grade_semestre") {
    add("turmas", args.turma_id, "turma_id");
    add("cursos", args.nova_turma?.curso_id, "nova_turma.curso_id");
    add("salas", args.sala_id, "sala_id");
    for (const [index, item] of (args.itens || []).entries()) {
      add("salas", item.sala_id, `itens[${index}].sala_id`);
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

function isBulkGradeRequest(value) {
  const text = String(value || "");
  const codes = text.match(/\b[A-ZÀ-Ú]{3,6}\d{3,5}\b/g) || [];
  const hasSemester = /semestre\s*[:\-]?\s*\d{4}[.][12]/i.test(text) ||
    /[—-]\s*\d{4}[.][12]\s*$/m.test(text);
  const hasBasicHeader = /\bdisciplina\b/i.test(text) && /\bCH\b/i.test(text);
  const hasDetailedHeader = hasBasicHeader &&
    /\bdocente\b/i.test(text) && /per[ií]odo/i.test(text);
  const hasDatedRow = /\d+\s*h\s+.+?\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4})\s+a\s+\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4})/i.test(text);
  return hasSemester && hasBasicHeader &&
    (codes.length >= 2 || (hasDetailedHeader && (codes.length >= 1 || hasDatedRow)));
}

function gradeRoutingContext() {
  return `[ROTEAMENTO OBRIGATÓRIO — IMPORTAÇÃO DE GRADE]
Este texto é uma grade semestral em lote, não uma consulta sobre uma disciplina.
- O título antes do semestre (por exemplo, "Engenharia de Software") é o CURSO. Nunca o procure em disciplinas.
- "Turma: 1º período" indica o período acadêmico da turma, não o nome de uma disciplina.
- Cada linha iniciada por código (por exemplo, DMEI1024) é uma disciplina da grade.
- Primeiro consulte cursos pelo título, turmas pelo curso/ano/semestre/turno e salas pelo número.
- Se o curso existir mas a turma de ingresso do semestre informado não existir, use nova_turma dentro de importar_grade_semestre; inspecione as turmas anteriores do curso para manter o padrão de nome.
- Use uma única chamada importar_grade_semestre para a turma e todo o lote.
- Não procure o título do curso na entidade disciplinas.`;
}

function routeToolArguments(name, args, hasPendingGrade) {
  if (
    hasPendingGrade &&
    name === "consultar_dados" &&
    ["disciplinas", "curso_disciplinas"].includes(args.entidade)
  ) {
    return { ...args, entidade: "cursos" };
  }
  return args;
}

function parseBulkGradeIntent(value) {
  const text = String(value || "");
  const heading = text.match(/^\s*(.+?)\s*[—-]\s*(\d{4})[.](1|2)\s*$/m);
  const classPeriod = text.match(/turma\s*:\s*(\d+)/i);
  const shift = text.match(/turno\s*:\s*([^·\n]+)/i);
  const room = text.match(/sala\s*:\s*0*(\d+)/i);
  const codes = [...new Set(text.match(/\b[A-ZÀ-Ú]{3,6}\d{3,5}\b/g) || [])];
  return {
    course: heading?.[1]?.trim() || null,
    year: heading ? Number(heading[2]) : null,
    semester: heading ? Number(heading[3]) : null,
    classPeriod: classPeriod ? Number(classPeriod[1]) : null,
    shift: shift?.[1]?.trim() || null,
    roomNumber: room ? Number(room[1]) : null,
    codes,
    lines: text.split(/\r?\n/),
    hasTeacherColumn: /\bdocente\b/i.test(text),
  };
}

function parseStructuredGrade(value) {
  const text = String(value || "");
  const intent = parseBulkGradeIntent(text);
  if (!intent.course || !intent.year || !intent.semester || !intent.classPeriod || !intent.shift) {
    return null;
  }
  const items = [];
  const rowPattern = /^\s*(?:([A-ZÀ-Ú]{3,6}\d{3,5})\s+)?(.+?)\s+(\d+)\s*h\s+(.+?)\s+(\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4}))\s+a\s+(\d{1,2}\/\d{1,2}\/(?:\d{2}|\d{4}))(?:\s+(.*))?\s*$/i;
  for (const line of intent.lines) {
    const match = line.match(rowPattern);
    if (!match) continue;
    const trailing = match[7]?.trim() || "";
    const type = /\bmodular\b/i.test(trailing)
      ? "MODULAR"
      : /\bsemanal\b|\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)s?\b/i.test(trailing)
        ? "SEMANAL"
        : "PENDENTE";
    items.push({
      ...(match[1] ? { codigo: match[1].toUpperCase() } : {}),
      disciplina: match[2].trim(),
      carga_horaria: Number(match[3]),
      docente: match[4].trim(),
      tipo_disciplina: type,
      periodos: [{ inicio: match[5], fim: match[6] }],
      ...(trailing ? { observacao: trailing } : {}),
    });
  }
  if (items.length < 1 || (intent.codes.length > 0 && items.length !== intent.codes.length)) return null;
  return { intent, items };
}

function parseStructuredAllocation(value) {
  const text = String(value || "").trim();
  const normalized = normalizeText(text);
  if (!/\b(aloque|alocar|alocacao)\b/.test(normalized)) return null;

  const discipline = text.match(
    /\bdisciplina(?:\s+de)?\s+(.+?)(?=,?\s*(?:com\s+carga|carga\s+hor[aá]ria|ministrad[ao]|com\s+(?:o\s+|a\s+)?professor|n[oa]s?\s+per[ií]odo|em\s+formato|na\s+sala|para\s+a\s+turma)|$)/i,
  );
  const workload = text.match(/carga\s+hor[aá]ria\s+(?:de\s+)?(\d+)\s*h\b/i);
  const teacher = text.match(
    /(?:ministrad[ao]\s+(?:pelo|pela)|com)\s+(?:o\s+|a\s+)?professor(?:a)?\s+(.+?)(?=,?\s*(?:n[oa]s?\s+per[ií]odo|n[oa]\s+parte|turno|em\s+formato|na\s+sala|para\s+a\s+turma)|$)/i,
  );
  const dates = text.match(
    /per[ií]odo\s+de\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)\s+a\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
  );
  const type = text.match(/(?:formato\s+)?\b(modular|semanal)\b/i);
  const room = text.match(/\bsala\s+0*(\d+)\b/i);
  const classWithYear = text.match(
    /\bturma(?:\s+de)?\s+(.+?)\s+(20\d{2})(?=\s*(?:[.,;!?]|na\s+sala|$))/i,
  );
  const shift = text.match(/(?:turno|parte\s+da)\s+(manh[aã]|tarde|noite)/i);

  if (!discipline || !teacher || !dates || !type || !room || !classWithYear) {
    return null;
  }
  return {
    disciplina: discipline[1].trim(),
    cargaHoraria: workload ? Number(workload[1]) : null,
    docente: teacher[1].trim(),
    dataInicio: dates[1],
    dataFim: dates[2],
    tipoDisciplina: type[1].toUpperCase(),
    salaNumero: Number(room[1]),
    turmaNome: classWithYear[1].trim(),
    turmaAno: Number(classWithYear[2]),
    turno: shift?.[1] || null,
  };
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
    this.pendingGradeText = null;
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

  bulkImportMismatch(args) {
    if (!this.pendingGradeText) return null;
    const intent = parseBulkGradeIntent(this.pendingGradeText);
    const errors = [];
    const normalizedShift = normalizeText(intent.shift);
    const verifiedCourse = [...(this.verifiedRecords.get("cursos")?.values() || [])]
      .find((course) => normalizeText(course.nome) === normalizeText(intent.course));

    if (args.turma_id) {
      const selectedClass = this.verifiedRecords.get("turmas")?.get(Number(args.turma_id));
      if (
        !selectedClass ||
        Number(selectedClass.ano_inicio) !== intent.year ||
        Number(selectedClass.semestre_inicio) !== intent.semester ||
        normalizeText(selectedClass.turno) !== normalizedShift ||
        (verifiedCourse && Number(selectedClass.curso_id) !== Number(verifiedCourse.id))
      ) {
        errors.push(
          `turma_id ${args.turma_id} não corresponde a ${intent.course} ${intent.year}.${intent.semester}, turno ${intent.shift}; use nova_turma`,
        );
      }
    } else if (args.nova_turma) {
      if (verifiedCourse && Number(args.nova_turma.curso_id) !== Number(verifiedCourse.id)) {
        errors.push(`nova_turma.curso_id deve ser ${verifiedCourse.id}`);
      }
      if (Number(args.nova_turma.ano_inicio) !== intent.year) {
        errors.push(`nova_turma.ano_inicio deve ser ${intent.year}`);
      }
      if (Number(args.nova_turma.semestre_inicio) !== intent.semester) {
        errors.push(`nova_turma.semestre_inicio deve ser ${intent.semester}`);
      }
      if (normalizeText(args.nova_turma.turno) !== normalizedShift) {
        errors.push(`nova_turma.turno deve ser ${intent.shift}`);
      }
    } else {
      errors.push("informe nova_turma, pois não existe turma compatível");
    }

    const roomIds = new Set([
      args.sala_id,
      ...(args.itens || []).map((item) => item.sala_id),
    ].filter((id) => id !== undefined && id !== null).map(Number));
    if (intent.roomNumber !== null) {
      if (roomIds.size === 0) errors.push(`a Sala ${intent.roomNumber} deve ser informada`);
      for (const roomId of roomIds) {
        const selectedRoom = this.verifiedRecords.get("salas")?.get(roomId);
        const selectedNumber = selectedRoom?.nome?.match(/\d+/)?.[0];
        if (Number(selectedNumber) !== intent.roomNumber) {
          errors.push(`sala_id ${roomId} não corresponde à Sala ${intent.roomNumber}`);
        }
      }
    }

    const items = args.itens || [];
    const proposedCodes = new Set(
      items.map((item) => String(item.codigo || "").toUpperCase()).filter(Boolean),
    );
    const missingCodes = intent.codes.filter((code) => !proposedCodes.has(code));
    const extraCodes = [...proposedCodes].filter((code) => !intent.codes.includes(code));
    if (missingCodes.length > 0) errors.push(`disciplinas ausentes: ${missingCodes.join(", ")}`);
    if (extraCodes.length > 0) errors.push(`códigos não presentes na fonte: ${extraCodes.join(", ")}`);

    for (const item of items) {
      const code = String(item.codigo || "").toUpperCase();
      const label = code || item.disciplina || "item";
      const sourceLine = intent.lines.find((line) =>
        code
          ? line.toUpperCase().includes(code)
          : normalizeText(line).includes(normalizeText(item.disciplina)),
      ) || "";
      const normalizedLine = normalizeText(sourceLine);
      if (item.disciplina && !normalizedLine.includes(normalizeText(item.disciplina))) {
        errors.push(`${label}: nome da disciplina não confere com a linha de origem`);
      }
      if (intent.hasTeacherColumn && !item.docente) {
        errors.push(`${label}: docente não foi extraído`);
      } else if (item.docente && !normalizedLine.includes(normalizeText(item.docente))) {
        errors.push(`${label}: docente '${item.docente}' não confere com a linha de origem`);
      }
      const hasExplicitType = /\b(modular|semanal)\b/i.test(sourceLine) ||
        /\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)s?\b/i.test(sourceLine);
      if (!hasExplicitType && item.tipo_disciplina !== "PENDENTE") {
        errors.push(`${label}: tipo deve ser PENDENTE porque a fonte não informa MODULAR/SEMANAL`);
      }
      if (item.lotacao_docente && !normalizedLine.includes(normalizeText(item.lotacao_docente))) {
        errors.push(`${label}: lotação '${item.lotacao_docente}' não aparece na linha de origem`);
      }
      if (item.observacao) {
        const observation = normalizeText(item.observacao);
        if (observation === "pendente" || !normalizedLine.includes(observation)) {
          errors.push(`${label}: observação '${item.observacao}' não aparece na linha de origem`);
        }
      }
    }

    return errors.length > 0
      ? `A proposta não confere com a grade original: ${errors.join("; ")}. Corrija a estrutura sem inventar dados.`
      : null;
  }

  correctBulkProposal(args) {
    if (!this.pendingGradeText) return args;
    const corrected = JSON.parse(JSON.stringify(args));
    const intent = parseBulkGradeIntent(this.pendingGradeText);
    const course = [...(this.verifiedRecords.get("cursos")?.values() || [])]
      .find((item) => normalizeText(item.nome) === normalizeText(intent.course));
    const selectedClass = corrected.turma_id
      ? this.verifiedRecords.get("turmas")?.get(Number(corrected.turma_id))
      : null;
    const classMatches = selectedClass &&
      Number(selectedClass.ano_inicio) === intent.year &&
      Number(selectedClass.semestre_inicio) === intent.semester &&
      normalizeText(selectedClass.turno) === normalizeText(intent.shift) &&
      (!course || Number(selectedClass.curso_id) === Number(course.id));

    if (!classMatches && course) {
      const previousNames = new Set(
        [...(this.verifiedRecords.get("turmas")?.values() || [])]
          .filter((item) => Number(item.curso_id) === Number(course.id))
          .map((item) => item.nome),
      );
      if (previousNames.size === 1) {
        delete corrected.turma_id;
        corrected.nova_turma = {
          nome: [...previousNames][0],
          curso_id: course.id,
          semestre_inicio: intent.semester,
          ano_inicio: intent.year,
          turno: intent.shift,
        };
      }
    }

    if (intent.roomNumber !== null) {
      const rooms = [...(this.verifiedRecords.get("salas")?.values() || [])]
        .filter((room) => Number(room.nome?.match(/\d+/)?.[0]) === intent.roomNumber);
      if (rooms.length === 1) {
        corrected.sala_id = rooms[0].id;
        for (const item of corrected.itens || []) delete item.sala_id;
      }
    }

    for (const item of corrected.itens || []) {
      const code = String(item.codigo || "").toUpperCase();
      const sourceLine = intent.lines.find((line) =>
        code
          ? line.toUpperCase().includes(code)
          : normalizeText(line).includes(normalizeText(item.disciplina)),
      ) || "";
      const normalizedLine = normalizeText(sourceLine);
      const hasExplicitType = /\b(modular|semanal)\b/i.test(sourceLine) ||
        /\b(segunda|ter[cç]a|quarta|quinta|sexta|s[aá]bado|domingo)s?\b/i.test(sourceLine);
      if (!hasExplicitType) item.tipo_disciplina = "PENDENTE";
      if (item.lotacao_docente && !normalizedLine.includes(normalizeText(item.lotacao_docente))) {
        delete item.lotacao_docente;
      }
      if (item.observacao && !normalizedLine.includes(normalizeText(item.observacao))) {
        delete item.observacao;
      }
    }
    return corrected;
  }

  async tryStructuredGradeImport(content) {
    const parsed = parseStructuredGrade(content);
    if (!parsed) return null;
    const { intent, items } = parsed;

    const read = async (args) => {
      this.onEvent({ type: "tool_start", name: "consultar_dados", args, isWrite: false });
      const result = await executeTool(
        "consultar_dados",
        args,
        this.db,
        { currentYear: this.currentYear },
      );
      this.rememberRecords(result);
      this.onEvent({ type: "tool_end", name: "consultar_dados", ok: true, data: result });
      return result;
    };

    const courses = await read({ entidade: "cursos", busca: intent.course, limite: 20 });
    const exactCourses = courses.registros.filter(
      (course) => normalizeText(course.nome) === normalizeText(intent.course),
    );
    if (exactCourses.length !== 1) {
      return exactCourses.length === 0
        ? `Não encontrei o curso '${intent.course}'. Cadastre ou corrija o nome do curso antes da importação.`
        : `Encontrei mais de um curso chamado '${intent.course}'. Informe o ID correto.`;
    }
    const course = exactCourses[0];

    let room = null;
    if (intent.roomNumber !== null) {
      const rooms = await read({ entidade: "salas", busca: `Sala ${intent.roomNumber}`, limite: 20 });
      const exactRooms = rooms.registros.filter(
        (item) => Number(item.nome?.match(/\d+/)?.[0]) === intent.roomNumber,
      );
      if (exactRooms.length !== 1) {
        return `Não consegui identificar de forma única a Sala ${intent.roomNumber}. Informe o ID da sala.`;
      }
      room = exactRooms[0];
    }

    const classes = await read({ entidade: "turmas", curso_id: course.id, limite: 100 });
    const exactClasses = classes.registros.filter((item) =>
      Number(item.ano_inicio) === intent.year &&
      Number(item.semestre_inicio) === intent.semester &&
      normalizeText(item.turno) === normalizeText(intent.shift),
    );
    let classArguments;
    if (exactClasses.length === 1) {
      classArguments = { turma_id: exactClasses[0].id };
    } else if (exactClasses.length > 1) {
      return `Há mais de uma turma de ${intent.course} para ${intent.year}.${intent.semester}, turno ${intent.shift}. Informe o ID correto.`;
    } else {
      const names = new Set(classes.registros.map((item) => item.nome));
      if (names.size !== 1) {
        return `Não existe turma para ${intent.year}.${intent.semester} e não consegui inferir um nome único. Informe o nome da nova turma.`;
      }
      classArguments = {
        nova_turma: {
          nome: [...names][0],
          curso_id: course.id,
          semestre_inicio: intent.semester,
          ano_inicio: intent.year,
          turno: intent.shift,
        },
      };
    }

    const result = await this.executeToolCall({
      function: {
        name: "importar_grade_semestre",
        arguments: {
          ...classArguments,
          ano_letivo: intent.year,
          semestre_letivo: intent.semester,
          periodo_turma: intent.classPeriod,
          turno: intent.shift,
          ...(room ? { sala_id: room.id } : {}),
          texto_origem: content,
          itens: items,
        },
      },
    });
    if (result.cancelado) return "Importação cancelada. Nenhum dado da grade foi inserido.";
    if (!result.ok) return `Não foi possível importar a grade: ${result.error}`;
    const data = result.data;
    return `Grade ${data.semestre} importada com sucesso: ${data.total_importado} disciplinas. ` +
      `${data.turma_criada ? `A turma ${data.turma.nome} foi criada com ID ${data.turma.id}. ` : ""}` +
      `ID da importação: ${data.importacao_id}.`;
  }

  async tryStructuredAllocation(content) {
    const intent = parseStructuredAllocation(content);
    if (!intent) return null;

    const read = async (args) => {
      this.onEvent({ type: "tool_start", name: "consultar_dados", args, isWrite: false });
      const result = await executeTool(
        "consultar_dados",
        args,
        this.db,
        { currentYear: this.currentYear },
      );
      this.rememberRecords(result);
      this.onEvent({ type: "tool_end", name: "consultar_dados", ok: true, data: result });
      return result;
    };

    const rooms = await read({ entidade: "salas", busca: `Sala ${intent.salaNumero}`, limite: 20 });
    const exactRooms = rooms.registros.filter(
      (item) => Number(item.nome?.match(/\d+/)?.[0]) === intent.salaNumero,
    );
    if (exactRooms.length !== 1) {
      return `Não consegui identificar de forma única a Sala ${intent.salaNumero}. Informe o ID da sala.`;
    }
    const room = exactRooms[0];

    const directClasses = await read({
      entidade: "turmas",
      busca: intent.turmaNome,
      ano: intent.turmaAno,
      limite: 100,
    });
    let matchingClasses = directClasses.registros.filter(
      (item) => normalizeText(item.nome) === normalizeText(intent.turmaNome) &&
        Number(item.ano_inicio) === intent.turmaAno,
    );

    if (matchingClasses.length === 0) {
      const historicalClasses = await read({
        entidade: "turmas",
        busca: intent.turmaNome,
        limite: 100,
      });
      const courseIds = new Set(
        historicalClasses.registros
          .filter((item) => normalizeText(item.nome) === normalizeText(intent.turmaNome))
          .map((item) => Number(item.curso_id)),
      );
      if (courseIds.size === 1) {
        const courseClasses = await read({
          entidade: "turmas",
          curso_id: [...courseIds][0],
          ano: intent.turmaAno,
          limite: 100,
        });
        matchingClasses = courseClasses.registros;
      }
    }

    if (matchingClasses.length !== 1) {
      if (matchingClasses.length === 0) {
        return `Não encontrei uma turma que corresponda a '${intent.turmaNome} ${intent.turmaAno}'.`;
      }
      const options = matchingClasses
        .map((item) => `ID ${item.id}: ${item.nome}, ${item.ano_inicio}.${item.semestre_inicio}, ${item.turno}`)
        .join("; ");
      return `Encontrei mais de uma turma compatível com '${intent.turmaNome} ${intent.turmaAno}': ${options}. Informe o ID correto.`;
    }
    const academicClass = matchingClasses[0];
    if (intent.turno && normalizeText(academicClass.turno) !== normalizeText(intent.turno)) {
      return `A turma selecionada está cadastrada no turno ${academicClass.turno}, ` +
        `mas o pedido informa ${intent.turno}. Informe qual turno deve ser usado.`;
    }

    const subjects = await read({
      entidade: "disciplinas",
      busca: intent.disciplina,
      curso_id: academicClass.curso_id,
      limite: 20,
    });
    const exactSubjects = subjects.registros.filter(
      (item) => normalizeText(item.nome) === normalizeText(intent.disciplina),
    );
    if (exactSubjects.length === 0) {
      return `Não encontrei a disciplina '${intent.disciplina}' vinculada ao curso ` +
        `'${academicClass.curso_nome}'. Cadastre o vínculo antes de fazer a alocação.`;
    }
    const compatibleSubjects = intent.cargaHoraria === null
      ? exactSubjects
      : exactSubjects.filter((item) => Number(item.carga_horaria) === intent.cargaHoraria);
    if (compatibleSubjects.length === 0) {
      const workloads = [...new Set(exactSubjects.map((item) => `${item.carga_horaria}h`))].join(", ");
      return `A disciplina '${intent.disciplina}' está cadastrada no curso com carga ${workloads}, ` +
        `mas o pedido informa ${intent.cargaHoraria}h. Corrija a carga antes da alocação.`;
    }
    const workloads = new Set(compatibleSubjects.map((item) => Number(item.carga_horaria)));
    if (workloads.size > 1) {
      const options = compatibleSubjects
        .map((item) => `ID ${item.id} (${item.carga_horaria}h)`)
        .join(", ");
      return `Existem disciplinas homônimas com cargas diferentes: ${options}. Informe o ID correto.`;
    }
    const subjectCodes = new Set(compatibleSubjects.map((item) => normalizeText(item.codigo)).filter(Boolean));
    if (subjectCodes.size > 1) {
      const options = compatibleSubjects.map((item) => `ID ${item.id} (${item.codigo})`).join(", ");
      return `Existem disciplinas homônimas com códigos diferentes: ${options}. Informe o ID correto.`;
    }
    const subject = compatibleSubjects.sort((left, right) => Number(left.id) - Number(right.id))[0];

    const teachers = await read({
      entidade: "professores",
      busca: intent.docente,
      curso_id: academicClass.curso_id,
      limite: 20,
    });
    const exactTeachers = teachers.registros.filter(
      (item) => normalizeText(item.nome) === normalizeText(intent.docente),
    );
    if (exactTeachers.length !== 1) {
      return exactTeachers.length === 0
        ? `Não encontrei o professor '${intent.docente}' vinculado ao curso '${academicClass.curso_nome}'.`
        : `Encontrei mais de um professor chamado '${intent.docente}' nesse curso. Informe o ID correto.`;
    }
    const teacher = exactTeachers[0];

    const result = await this.executeToolCall({
      function: {
        name: "cadastrar_alocacao_periodo",
        arguments: {
          turma_id: academicClass.id,
          disciplina_id: subject.id,
          professor_id: teacher.id,
          sala_id: room.id,
          turno: intent.turno || academicClass.turno,
          tipo_disciplina: intent.tipoDisciplina,
          data_inicio: intent.dataInicio,
          data_fim: intent.dataFim,
        },
      },
    });
    if (result.cancelado) return "Alocação cancelada. Nenhum dado foi inserido.";
    if (!result.ok) return `Não foi possível cadastrar a alocação: ${result.error}`;
    return `Alocação cadastrada com sucesso. ID: ${result.data.id}. ` +
      `${subject.nome} (${subject.carga_horaria}h), professor ${teacher.nome}, ` +
      `${room.nome}, turma ${academicClass.nome} ${academicClass.ano_inicio}, ` +
      `de ${intent.dataInicio} a ${intent.dataFim}, em formato ${intent.tipoDisciplina}.`;
  }

  async executeToolCall(toolCall) {
    const fn = toolCall.function || {};
    const name = fn.name;
    let args = routeToolArguments(
      name,
      parseToolArguments(fn.arguments),
      Boolean(this.pendingGradeText),
    );
    if (
      this.pendingGradeText &&
      name === "consultar_dados" &&
      args.entidade === "salas"
    ) {
      const roomNumber = parseBulkGradeIntent(this.pendingGradeText).roomNumber;
      if (roomNumber !== null) args = { ...args, busca: `Sala ${roomNumber}` };
    }
    if (name === "importar_grade_semestre" && (this.pendingGradeText || this.lastUserText)) {
      args.texto_origem = this.pendingGradeText || this.lastUserText;
      args = this.correctBulkProposal(args);
    }
    const isWrite = WRITE_TOOLS.has(name);
    this.onEvent({ type: "tool_start", name, args, isWrite });

    if (this.pendingGradeText && name === "cadastrar_turma") {
      return {
        ok: false,
        error: "Durante uma importação de grade, não cadastre a turma separadamente. Use importar_grade_semestre com nova_turma para criar turma e grade na mesma transação.",
      };
    }

    const missing = missingRequiredArguments(name, args);
    if (missing.length > 0) {
      return {
        ok: false,
        error: `Campos obrigatórios ausentes: ${missing.join(", ")}. Consulte os dados necessários e tente novamente.`,
      };
    }
    const validationErrors = schemaValidationErrors(name, args);
    if (validationErrors.length > 0) {
      return {
        ok: false,
        error: `Argumentos inválidos: ${validationErrors.join("; ")}. Corrija antes de tentar novamente.`,
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
      if (name === "importar_grade_semestre") {
        const bulkMismatch = this.bulkImportMismatch(args);
        if (bulkMismatch) return { ok: false, error: bulkMismatch };
      }
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
      let data = await executeTool(name, args, this.db, { currentYear: this.currentYear });
      if (
        this.pendingGradeText &&
        name === "consultar_dados" &&
        args.entidade === "turmas" &&
        data.total_retornado === 0
      ) {
        const verifiedCourses = this.verifiedRecords.get("cursos");
        const courseId = args.curso_id ||
          (verifiedCourses?.size === 1 ? [...verifiedCourses.keys()][0] : null);
        if (courseId) {
          const previousClasses = await executeTool(
            "consultar_dados",
            { entidade: "turmas", curso_id: courseId, limite: 30 },
            this.db,
            { currentYear: this.currentYear },
          );
          data = {
            ...previousClasses,
            correspondencia_exata: false,
            criterios_sem_resultado: args,
            instrucao:
              "Não existe turma para o semestre solicitado. Não repita a consulta. Use o padrão de nome das turmas retornadas e chame importar_grade_semestre com nova_turma; a turma e a grade serão criadas na mesma transação.",
          };
        }
      }
      if (name === "consultar_dados") this.rememberRecords(data);
      if (name === "importar_grade_semestre") this.pendingGradeText = null;
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
    this.lastUserText = content;
    const bulkGrade = isBulkGradeRequest(content);
    if (bulkGrade) this.pendingGradeText = content;
    const routedContent = bulkGrade
      ? `${gradeRoutingContext()}\n\n[TEXTO ORIGINAL DO USUÁRIO]\n${content}`
      : content;
    this.messages.push({ role: "user", content: routedContent });

    if (bulkGrade) {
      const structuredResult = await this.tryStructuredGradeImport(content);
      if (structuredResult !== null) {
        this.messages.push({ role: "assistant", content: structuredResult });
        return structuredResult;
      }
    }

    const structuredAllocation = await this.tryStructuredAllocation(content);
    if (structuredAllocation !== null) {
      this.messages.push({ role: "assistant", content: structuredAllocation });
      return structuredAllocation;
    }

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
  isBulkGradeRequest,
  routeToolArguments,
  schemaValidationErrors,
  parseBulkGradeIntent,
  parseStructuredGrade,
  parseStructuredAllocation,
};
