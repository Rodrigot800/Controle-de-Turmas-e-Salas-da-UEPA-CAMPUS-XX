function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STOPWORDS = new Set(["a", "as", "o", "os", "de", "da", "das", "do", "dos", "e", "em", "com"]);

function meaningfulTokens(value) {
  return normalizeText(value).split(" ").filter((token) => token && !STOPWORDS.has(token));
}

function tokenSignature(value) {
  return meaningfulTokens(value).sort().join(" ");
}

function matchNamedRecord(sourceName, records, { allowSubset = false } = {}) {
  const normalized = normalizeText(sourceName);
  const exact = records.filter((item) => normalizeText(item.nome) === normalized);
  if (exact.length === 1) return { record: exact[0], mode: "EXATO" };
  if (exact.length > 1) return { ambiguous: exact };

  const signature = tokenSignature(sourceName);
  const equivalent = records.filter((item) => tokenSignature(item.nome) === signature);
  if (equivalent.length === 1) return { record: equivalent[0], mode: "EQUIVALENTE" };
  if (equivalent.length > 1) return { ambiguous: equivalent };

  if (allowSubset) {
    const sourceTokens = new Set(meaningfulTokens(sourceName));
    const subset = records.filter((item) => {
      const candidateTokens = new Set(meaningfulTokens(item.nome));
      const sourceInsideCandidate = [...sourceTokens].every((token) => candidateTokens.has(token));
      const candidateInsideSource = [...candidateTokens].every((token) => sourceTokens.has(token));
      return sourceInsideCandidate || candidateInsideSource;
    });
    if (subset.length === 1) return { record: subset[0], mode: "APROXIMADO" };
    if (subset.length > 1) return { ambiguous: subset };
  }
  return { record: null, mode: "NOVO" };
}

function roomNumber(name) {
  const match = String(name || "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function resolveRoom(value, rooms) {
  const normalized = normalizeText(value);
  let matches = rooms.filter((room) => normalizeText(room.nome) === normalized);
  if (matches.length === 0 && /^0*\d+$/.test(String(value || "").trim())) {
    const number = Number(value);
    matches = rooms.filter((room) => roomNumber(room.nome) === number);
  }
  if (matches.length === 1) return { room: matches[0] };
  if (matches.length > 1) return { error: `A sala '${value}' é ambígua: ${matches.map((item) => item.nome).join(", ")}.` };
  return { error: `A sala '${value}' não está cadastrada.` };
}

function minMaxPeriods(periods) {
  const starts = periods.map((period) => period.inicio).sort();
  const ends = periods.map((period) => period.fim).sort();
  return { inicio: starts[0], fim: ends[ends.length - 1] };
}

function rangesOverlap(left, right) {
  return left.inicio <= right.fim && right.inicio <= left.fim;
}

function genericSubject(name) {
  return ["optativa", "eletiva", "topicos especiais", "tcc"].includes(normalizeText(name));
}

async function analyzePlanningDocument(db, document, options = {}) {
  const roomAssignments = options.roomAssignments || {};
  const ignorePending = options.ignorePending === true;
  const [coursesResult, roomsResult, teachersResult] = await Promise.all([
    db.query("SELECT id, nome, vagas, semestres FROM cursos ORDER BY id"),
    db.query("SELECT id, nome, capacidade, piso, tipo_sala FROM salas ORDER BY id"),
    db.query("SELECT id, nome, lotacao FROM professores ORDER BY id"),
  ]);
  const matchingCourses = coursesResult.rows.filter(
    (course) => normalizeText(course.nome) === normalizeText(document.curso),
  );
  if (matchingCourses.length !== 1) {
    return {
      pronto: false,
      erros: matchingCourses.length === 0
        ? [`O curso '${document.curso}' não está cadastrado.`]
        : [`Há mais de um curso correspondente a '${document.curso}'.`],
      pendencias: [],
      turmas: [],
    };
  }
  const course = matchingCourses[0];
  const [classesResult, subjectsResult, allocationsResult] = await Promise.all([
    db.query(
      `SELECT id, nome, curso_id, semestre_inicio, ano_inicio, turno
       FROM turmas WHERE curso_id = $1 ORDER BY ano_inicio, semestre_inicio, turno`,
      [course.id],
    ),
    db.query(
      `SELECT d.id, d.codigo, d.nome, d.carga_horaria, cd.semestre_disciplina
       FROM disciplinas d
       JOIN curso_disciplinas cd ON cd.disciplina_id = d.id
       WHERE cd.curso_id = $1 ORDER BY d.id`,
      [course.id],
    ),
    db.query(
      `SELECT ap.id, ap.turma_id, ap.disciplina_id, ap.sala_id, ap.turno,
              ap.data_inicio::text, ap.data_fim::text, ap.ano_letivo, ap.semestre_letivo,
              t.nome AS turma_nome, d.nome AS disciplina_nome, s.nome AS sala_nome
       FROM alocacoes_periodo ap
       JOIN turmas t ON t.id = ap.turma_id
       LEFT JOIN disciplinas d ON d.id = ap.disciplina_id
       LEFT JOIN salas s ON s.id = ap.sala_id
       WHERE t.curso_id = $1 AND ap.ano_letivo = $2 AND ap.semestre_letivo = $3`,
      [course.id, document.turmas[0].ano_letivo, document.turmas[0].semestre_letivo],
    ),
  ]);

  const errors = [];
  const pending = [];
  const warnings = [];
  const preparedGrades = [];
  const stats = {
    linhas_fonte: document.total_linhas,
    importaveis: 0,
    pendentes: 0,
    disciplinas_existentes: 0,
    disciplinas_novas: 0,
    codigos_a_atualizar: 0,
    professores_existentes: 0,
    professores_novos: 0,
    cargas_horarias_a_atualizar: 0,
  };

  for (const grade of document.turmas) {
    const expectedStartYear = Number(grade.ano_inicio_turma) ||
      (grade.ano_letivo - Math.floor(grade.periodo_turma / 2));
    const requestedClassName = normalizeText(grade.turma_nome);
    const classMatches = classesResult.rows.filter((item) =>
      Number(item.ano_inicio) === expectedStartYear &&
      normalizeText(item.turno) === normalizeText(grade.turno) &&
      (!requestedClassName ||
        normalizeText(item.nome) === requestedClassName ||
        normalizeText(item.nome).startsWith(`${requestedClassName} `)),
    );
    let academicClass = null;
    if (classMatches.length === 1) academicClass = classMatches[0];
    else if (classMatches.length === 0) {
      errors.push(
        `${grade.periodo_turma}º período/${grade.turno}: não há turma ` +
        `${grade.turma_nome ? `'${grade.turma_nome}' ` : ""}do curso iniciada em ${expectedStartYear}.`,
      );
    } else {
      errors.push(
        `${grade.periodo_turma}º período/${grade.turno}: mais de uma turma iniciada em ${expectedStartYear}.`,
      );
    }

    const assignment = roomAssignments[grade.periodo_turma] ?? roomAssignments[String(grade.periodo_turma)];
    let room = null;
    if (assignment !== undefined) {
      const resolution = resolveRoom(assignment, roomsResult.rows);
      if (resolution.error) errors.push(`${grade.periodo_turma}º período: ${resolution.error}`);
      else room = resolution.room;
    } else {
      pending.push(`${grade.periodo_turma}º período/${grade.turno}: informe a sala.`);
    }
    if (room && Number(room.capacidade || 0) < Number(course.vagas || 0)) {
      warnings.push(
        `${room.nome} comporta ${room.capacidade} pessoas, menos que as ${course.vagas} vagas do curso.`,
      );
    }

    const preparedItems = [];
    const itemReports = [];
    const seenCodes = new Set();
    for (const issue of grade.pendencias_extracao) {
      pending.push(`Página ${issue.pagina}, ${issue.disciplina}: ${issue.motivo}.`);
    }
    for (const item of grade.itens) {
      const itemLabel = item.codigo ? `${item.codigo} — ${item.disciplina}` : item.disciplina;
      if (item.codigo && seenCodes.has(item.codigo)) {
        errors.push(`${grade.periodo_turma}º período: o código ${item.codigo} apareceu mais de uma vez.`);
        itemReports.push({ fonte: itemLabel, estado: "ERRO", motivo: "código repetido na extração" });
        continue;
      }
      if (item.codigo) seenCodes.add(item.codigo);
      if (item.extracao_confiavel === false) {
        itemReports.push({
          fonte: itemLabel || "linha sem identificação",
          estado: "PENDENTE",
          motivo: "extração não comprovada no texto-fonte",
        });
        continue;
      }
      if (item.codigo && !/^[A-Z]{4}\d{4}$/.test(item.codigo)) {
        warnings.push(
          `${item.codigo} possui formato incomum; confirme o código no documento antes de gravar.`,
        );
      }
      if (!item.disciplina || !item.carga_horaria || !item.docente || item.periodos.length === 0) {
        pending.push(`${itemLabel}: a linha está incompleta.`);
        itemReports.push({ fonte: itemLabel, estado: "PENDENTE", motivo: "linha incompleta" });
        continue;
      }
      if (genericSubject(item.disciplina)) {
        pending.push(`${itemLabel}: informe qual disciplina optativa/TCC deve ser usada.`);
        itemReports.push({ fonte: itemLabel, estado: "PENDENTE", motivo: "disciplina genérica" });
        continue;
      }

      let subjectMatch = null;
      if (item.codigo) {
        const byCode = subjectsResult.rows.filter(
          (subject) => subject.codigo && normalizeText(subject.codigo) === normalizeText(item.codigo),
        );
        if (byCode.length === 1) subjectMatch = { record: byCode[0], mode: "CÓDIGO" };
        else if (byCode.length > 1) subjectMatch = { ambiguous: byCode };
      }
      if (!subjectMatch) subjectMatch = matchNamedRecord(item.disciplina, subjectsResult.rows);
      if (!subjectMatch.record && !subjectMatch.ambiguous) {
        const sameWorkload = subjectsResult.rows.filter(
          (subject) => Number(subject.carga_horaria) === Number(item.carga_horaria),
        );
        subjectMatch = matchNamedRecord(item.disciplina, sameWorkload, { allowSubset: true });
      }
      if (subjectMatch.ambiguous) {
        errors.push(`${itemLabel}: corresponde a mais de uma disciplina cadastrada.`);
        itemReports.push({ fonte: itemLabel, estado: "ERRO", motivo: "disciplina ambígua" });
        continue;
      }
      const subject = subjectMatch.record;
      if (subject && item.codigo && subject.codigo && normalizeText(subject.codigo) !== normalizeText(item.codigo)) {
        errors.push(`${itemLabel}: o cadastro #${subject.id} já usa o código ${subject.codigo}.`);
        itemReports.push({ fonte: itemLabel, estado: "ERRO", motivo: "código divergente" });
        continue;
      }
      const previousWorkload = subject && Number(subject.carga_horaria) !== Number(item.carga_horaria)
        ? Number(subject.carga_horaria)
        : null;
      if (previousWorkload !== null) {
        stats.cargas_horarias_a_atualizar += 1;
        warnings.push(
          `${itemLabel}: a carga horária cadastrada será corrigida de ` +
          `${previousWorkload}h para ${item.carga_horaria}h conforme a fonte.`,
        );
      }

      const teacherMatch = matchNamedRecord(item.docente, teachersResult.rows, { allowSubset: true });
      if (teacherMatch.ambiguous) {
        errors.push(`${itemLabel}: o docente '${item.docente}' corresponde a mais de um cadastro.`);
        itemReports.push({ fonte: itemLabel, estado: "ERRO", motivo: "docente ambíguo" });
        continue;
      }
      const teacher = teacherMatch.record;
      if (teacherMatch.mode !== "EXATO" && teacher) {
        warnings.push(
          `${item.docente} foi relacionado a ${teacher.nome} (#${teacher.id}) por equivalência de nome.`,
        );
      }
      if (subject && academicClass) {
        const duplicate = allocationsResult.rows.find((allocation) =>
          Number(allocation.turma_id) === Number(academicClass.id) &&
          Number(allocation.disciplina_id) === Number(subject.id),
        );
        if (duplicate) {
          errors.push(`${itemLabel}: já existe a alocação #${duplicate.id} para ${academicClass.nome}.`);
          itemReports.push({ fonte: itemLabel, estado: "ERRO", motivo: "alocação duplicada" });
          continue;
        }
      }

      if (subject) {
        stats.disciplinas_existentes += 1;
        if (item.codigo && !subject.codigo) stats.codigos_a_atualizar += 1;
      } else stats.disciplinas_novas += 1;
      if (teacher) stats.professores_existentes += 1;
      else stats.professores_novos += 1;

      const prepared = {
        ...(item.codigo ? { codigo: item.codigo } : {}),
        disciplina: subject?.nome || item.disciplina,
        carga_horaria: item.carga_horaria,
        ...(previousWorkload !== null ? { corrigir_carga_horaria: true } : {}),
        docente: teacher?.nome || item.docente,
        ...(item.lotacao_docente ? { lotacao_docente: item.lotacao_docente } : {}),
        tipo_disciplina: item.tipo_disciplina,
        ...(item.dias_semana ? { dias_semana: item.dias_semana } : {}),
        ...(item.dia_semana ? { dia_semana: item.dia_semana } : {}),
        periodos: item.periodos,
        ...(item.observacao ? { observacao: item.observacao } : {}),
      };
      preparedItems.push(prepared);
      stats.importaveis += 1;
      itemReports.push({
        fonte: item.codigo
          ? `${item.codigo} — ${subject?.nome || item.disciplina}`
          : (subject?.nome || item.disciplina),
        disciplina: subject
          ? `${subject.nome} (#${subject.id}, cadastrada${subjectMatch.mode !== "EXATO" ? `, ${subjectMatch.mode.toLowerCase()}` : ""})`
          : `${item.disciplina} (será criada)`,
        professor: teacher
          ? `${teacher.nome} (#${teacher.id}, cadastrado${teacherMatch.mode !== "EXATO" ? `, ${teacherMatch.mode.toLowerCase()}` : ""})`
          : `${item.docente} (será criado)`,
        tipo: item.tipo_disciplina,
        ...(previousWorkload !== null
          ? { carga_horaria_anterior: previousWorkload, carga_horaria_nova: item.carga_horaria }
          : {}),
        dias_semana: item.dias_semana || [],
        periodos: item.periodos,
        estado: "PRONTO",
      });
    }

    if (academicClass) {
      preparedGrades.push({
        turma_id: academicClass.id,
        ano_letivo: grade.ano_letivo,
        semestre_letivo: grade.semestre_letivo,
        periodo_turma: grade.periodo_turma,
        turno: grade.turno,
        ...(room ? { sala_id: room.id } : {}),
        texto_origem: grade.texto_origem,
        itens: preparedItems,
        _relatorio: {
          turma: academicClass,
          sala: room,
          itens: itemReports,
        },
      });
    }
  }

  stats.pendentes = pending.length;
  const plannedRanges = [];
  for (const grade of preparedGrades) {
    if (!grade.sala_id) continue;
    for (const item of grade.itens) {
      plannedRanges.push({
        turma_id: grade.turma_id,
        turma_nome: grade._relatorio.turma.nome,
        sala_id: grade.sala_id,
        sala_nome: grade._relatorio.sala.nome,
        turno: grade.turno,
        disciplina: item.disciplina,
        ...minMaxPeriods(item.periodos),
      });
    }
  }
  const conflictKeys = new Set();
  for (let leftIndex = 0; leftIndex < plannedRanges.length; leftIndex += 1) {
    const left = plannedRanges[leftIndex];
    for (const right of plannedRanges.slice(leftIndex + 1)) {
      if (
        left.turma_id !== right.turma_id &&
        left.sala_id === right.sala_id &&
        normalizeText(left.turno) === normalizeText(right.turno) &&
        rangesOverlap(left, right)
      ) {
        const key = [left.sala_id, normalizeText(left.turno), ...[left.turma_id, right.turma_id].sort()].join(":");
        if (!conflictKeys.has(key)) {
          conflictKeys.add(key);
          errors.push(
            `${left.sala_nome}/${left.turno} foi atribuída simultaneamente a ${left.turma_nome} e ${right.turma_nome}.`,
          );
        }
      }
    }
  }
  for (const planned of plannedRanges) {
    const conflict = allocationsResult.rows.find((existing) =>
      existing.sala_id &&
      Number(existing.sala_id) === Number(planned.sala_id) &&
      Number(existing.turma_id) !== Number(planned.turma_id) &&
      normalizeText(existing.turno) === normalizeText(planned.turno) &&
      existing.data_inicio && existing.data_fim &&
      rangesOverlap(planned, { inicio: existing.data_inicio, fim: existing.data_fim }),
    );
    if (conflict) {
      const key = `existente:${planned.sala_id}:${conflict.id}:${planned.turma_id}`;
      if (!conflictKeys.has(key)) {
        conflictKeys.add(key);
        errors.push(
          `${planned.sala_nome}/${planned.turno} conflita com a alocação existente #${conflict.id} (${conflict.turma_nome}, ${conflict.disciplina_nome}).`,
        );
      }
    }
  }

  const effectivePending = ignorePending ? [] : pending;
  const gradesForImport = preparedGrades
    .filter((grade) => grade.itens.length > 0)
    .map(({ _relatorio, ...grade }) => grade);
  return {
    curso: course,
    semestre: document.semestre,
    pronto: errors.length === 0 && effectivePending.length === 0 &&
      gradesForImport.every((grade) => grade.sala_id),
    erros: errors,
    pendencias: pending,
    avisos: [...new Set(warnings)],
    estatisticas: stats,
    turmas: preparedGrades.map((grade) => grade._relatorio),
    gradesForImport,
    ignorando_pendencias: ignorePending,
  };
}

module.exports = {
  normalizeText,
  tokenSignature,
  matchNamedRecord,
  resolveRoom,
  analyzePlanningDocument,
};
