import { useState, useMemo } from "react";
import "../style/modalConflitoAlocacao.css";

export default function ModalConflitoAlocacao({ salas = [], turmas = [], cursos = [], alocacoes = [] }) {
  const [minimizado, setMinimizado] = useState(true);
  const [fechado, setFechado] = useState(false);

  // Funções auxiliares de busca
  const getTurma = (id) => turmas.find((t) => Number(t.id) === Number(id));
  const getSala = (id) => salas.find((s) => Number(s.id) === Number(id));
  const getCurso = (id) => cursos.find((c) => Number(c.id) === Number(id));

  // Detecção automática de conflitos
  const conflitos = useMemo(() => {
    const list = [];

    // Helper: converte ano/semestre para um número absoluto (ex: 2024.1 -> 4048, 2024.2 -> 4049)
    const absSem = (ano, sem) => Number(ano) * 2 + (Number(sem) === 2 ? 1 : 0);
    const absToPeriodStr = (abs) => `${Math.floor(abs / 2)}.${(abs % 2) === 0 ? 1 : 2}`;
    const formatPeriod = (start, end) => `${absToPeriodStr(start)} até ${absToPeriodStr(end)}`;

    // Tempo atual para ignorar turmas que já acabaram
    const hoje = new Date();
    const anoAtual = hoje.getFullYear();
    const semestreAtual = hoje.getMonth() >= 6 ? 2 : 1;
    const absAtual = absSem(anoAtual, semestreAtual);

    // Helper: descobre o período de vigência de uma alocação
    const getPeriodo = (aloc) => {
      const turma = getTurma(aloc.turma_id);
      if (!turma) return null;

      if (aloc.time_alocacao === "temporario") {
        const val = absSem(aloc.ano_temp, aloc.semestre_temp);
        return { start: val, end: val };
      } else {
        const curso = getCurso(turma.curso_id);
        const duracao = curso ? Number(curso.semestres) : 8; // Duração baseada no curso
        const start = absSem(turma.ano_inicio, turma.semestre_inicio);
        const end = start + duracao - 1; // Turma existe até o final do curso
        return { start, end };
      }
    };

    // 1. Sobreposição de salas (duas turmas na mesma sala, mesmo turno E mesmo período de tempo)
    const alocacoesGroup = {};

    alocacoes.forEach((aloc) => {
      // Agrupa por Sala e Turno (Manhã, Tarde, Noite)
      const key = `${aloc.sala_id}-${aloc.turno?.toLowerCase()}`;
      if (!alocacoesGroup[key]) {
        alocacoesGroup[key] = [];
      }
      alocacoesGroup[key].push(aloc);
    });

    Object.values(alocacoesGroup).forEach((grupo) => {
      if (grupo.length > 1) {
        // Compara todas as alocações dentro do mesmo grupo
        for (let i = 0; i < grupo.length; i++) {
          for (let j = i + 1; j < grupo.length; j++) {
            const aloc1 = grupo[i];
            const aloc2 = grupo[j];

            const p1 = getPeriodo(aloc1);
            const p2 = getPeriodo(aloc2);

            if (p1 && p2) {
              // Ignora se qualquer uma das turmas envolvidas já terminou no passado
              if (p1.end < absAtual || p2.end < absAtual) continue;

              // Verifica sobreposição de intervalos: inicio1 <= fim2 E inicio2 <= fim1
              if (p1.start <= p2.end && p2.start <= p1.end) {
                const turma1 = getTurma(aloc1.turma_id);
                const turma2 = getTurma(aloc2.turma_id);
                const sala = getSala(aloc1.sala_id);

                list.push({
                  id: `sobre-${aloc1.id}-${aloc2.id}`,
                  tipo: "sobreposicao",
                  salaNome: sala ? sala.nome : `Sala ${aloc1.sala_id}`,
                  turno: aloc1.turno,
                  turma1: turma1,
                  turma2: turma2,
                  turma1Period: formatPeriod(p1.start, p1.end),
                  turma2Period: formatPeriod(p2.start, p2.end),
                  alocacao1: aloc1,
                  alocacao2: aloc2,
                  sugestao: "Choque de horário! Altere o turno, a sala, ou verifique a duração do curso."
                });
              }
            }
          }
        }
      }
    });

    // 2. Turmas não alocadas
    const turmasAlocadasIds = new Set(alocacoes.map((a) => Number(a.turma_id)));
    turmas.forEach((turma) => {
      if (!turmasAlocadasIds.has(Number(turma.id))) {
        const curso = getCurso(turma.curso_id);
        const duracao = curso ? Number(curso.semestres) : 8;
        const end = absSem(turma.ano_inicio, turma.semestre_inicio) + duracao - 1;

        // Se a turma já se formou/terminou, não apita como "Sem Sala"
        if (end >= absAtual) {
          list.push({
            id: `nao-aloc-${turma.id}`,
            tipo: "nao_alocada",
            salaNome: "Sem Sala (Não Alocada)",
            turno: turma.turno || "N/A",
            turma: { ...turma, cursoNome: curso ? curso.nome : "Desconhecido" },
            sugestao: "Aloque esta turma em uma sala disponível."
          });
        }
      }
    });

    return list;
  }, [salas, turmas, cursos, alocacoes]);

  if (fechado) return null;

  return (
    <div 
      className={`conflito-panel ${minimizado ? "minimizado" : ""}`}
      style={conflitos.length === 0 ? { borderColor: "#e5e7eb" } : {}}
    >
      <div 
        className="conflito-header" 
        onClick={() => setMinimizado(!minimizado)}
        style={conflitos.length === 0 ? { background: "#ffffff", borderBottomColor: "#e5e7eb" } : {}}
      >
        <div className="conflito-header-left">
          <span className="conflito-icon-alerta">
            {conflitos.length > 0 ? "⚠️" : "✅"}
          </span>
          <span 
            className="conflito-titulo"
            style={conflitos.length === 0 ? { color: "#374151" } : {}}
          >
            Conflitos de Alocação
          </span>
          <span
            className="conflito-count"
            style={conflitos.length === 0 ? { background: "#d1fae5", color: "#065f46" } : {}}
          >
            {conflitos.length}
          </span>
        </div>
        <div className="conflito-header-right">
          <span className="conflito-chevron">
            {minimizado ? "▲" : "▼"}
          </span>
          <button
            className="conflito-fechar"
            onClick={(e) => {
              e.stopPropagation();
              setFechado(true);
            }}
            title="Fechar aviso"
          >
            ✕
          </button>
        </div>
      </div>

      {!minimizado && (
        <div className="conflito-lista">
          {conflitos.length === 0 ? (
            <div
              className="conflito-item"
              style={{
                textAlign: "center",
                background: "#ecfdf5",
                borderColor: "#a7f3d0",
                color: "#065f46",
                padding: "20px 10px"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>🎉</div>
              <strong>Tudo certo!</strong>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#047857" }}>
                Nenhum conflito de horário encontrado e todas as turmas estão alocadas.
              </p>
            </div>
          ) : (
            conflitos.map((c) => (
              <div key={c.id} className="conflito-item">
                <div className="conflito-item-header">
                  <span
                    className={`conflito-tag ${
                      c.tipo === "sobreposicao" ? "tag-sobreposicao" : "tag-sem-alocacao"
                    }`}
                  >
                    {c.tipo === "sobreposicao" ? "Sobreposição" : "Não Alocada"}
                  </span>
                  <span className="conflito-item-titulo" title={c.salaNome}>
                    {c.salaNome.length > 20 ? c.salaNome.substring(0, 20) + "..." : c.salaNome}
                    {c.turno && ` (${c.turno})`}
                  </span>
                </div>

                {c.tipo === "sobreposicao" ? (
                  <>
                    <p className="conflito-item-desc" style={{ marginBottom: "2px" }}>
                      <strong>T1:</strong> {c.turma1?.nome || "Desconhecida"} 
                    </p>
                    <p className="conflito-item-detalhe" style={{ marginBottom: "8px" }}>
                      Período ativo: {c.turma1Period}
                    </p>
                    <p className="conflito-item-desc" style={{ marginBottom: "2px" }}>
                      <strong>T2:</strong> {c.turma2?.nome || "Desconhecida"}
                    </p>
                    <p className="conflito-item-detalhe" style={{ marginBottom: "4px" }}>
                      Período ativo: {c.turma2Period}
                    </p>
                    <p className="conflito-item-detalhe" style={{ marginTop: "6px", color: "#b91c1c", fontWeight: 500 }}>
                      ⚠️ O período dessas turmas se compromete.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="conflito-item-desc">
                      <strong>Turma:</strong> {c.turma?.nome}.{c.turma?.ano_inicio}.{c.turma?.semestre_inicio}
                    </p>
                    <p className="conflito-item-detalhe">Curso: {c.turma?.cursoNome}</p>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}