import { useState } from "react";
import "../style/tabelaAlocacoes.css";

export default function TabelaAlocacoes({ salas, turmas, cursos, alocacoes }) {
  // Os dados agora vêm via props do App.jsx
  // Não mais carregados localmente

  // ─── Filtros de semestre ───────────────────────────────────────────────────
  // Ano e semestre selecionados pelo usuário nos selects da tabela
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [semestreSelecionado, setSemestreSelecionado] = useState(1);

  // ─── Funções auxiliares ────────────────────────────────────────────────────

  /**
   * Converte ano + semestre em um número absoluto e crescente.
   * Serve para comparar períodos letivos facilmente.
   *
   * Exemplos:
   *   2025.1 → 2025 * 2 + 0 = 4050
   *   2025.2 → 2025 * 2 + 1 = 4051
   *   2026.1 → 2026 * 2 + 0 = 4052
   */
  function semestreAbsoluto(ano, semestre) {
    return Number(ano) * 2 + (Number(semestre) === 2 ? 1 : 0);
  }

  /**
   * Calcula o percentual de conclusão de uma turma
   * Exemplo: turma no 2º semestre de um curso de 4 semestres = 50%
   */
  function calcularPercentualTurma(turma) {
    const curso = cursos.find((c) => Number(c.id) === Number(turma.curso_id));
    if (!curso) return 0;

    const inicio = semestreAbsoluto(turma.ano_inicio, turma.semestre_inicio);
    const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);
    const duracao = Number(curso.semestres);

    const semestresCursados = atual - inicio + 1;
    const percentual = Math.min(100, Math.max(0, (semestresCursados / duracao) * 100));
    
    return Math.round(percentual);
  }

  /**
   * Verifica se uma turma está dentro do seu período letivo normal.
   * Usado APENAS para alocações definitivas.
   * Alocações temporárias ignoram essa verificação (são tratadas antes).
   *
   * Exemplo: turma que começou em 2024.1 num curso de 4 semestres
   *   início = semestreAbsoluto(2024, 1) = 4048
   *   fim    = 4048 + 4 - 1             = 4051  (termina em 2025.2)
   *   atual  = semestreAbsoluto(2026, 1) = 4052
   *   4052 >= 4048 && 4052 <= 4051 → false (turma já formada)
   */
  function turmaEstaAtiva(turma) {
    // Busca o curso da turma para saber a duração em semestres
    const curso = cursos.find((c) => Number(c.id) === Number(turma.curso_id));

    // Se o curso não for encontrado, considera inativa por segurança
    if (!curso) return false;

    const inicio = semestreAbsoluto(turma.ano_inicio, turma.semestre_inicio);
    const fim = inicio + Number(curso.semestres) - 1; // Último semestre da turma
    const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);

    // A turma está ativa se o semestre atual estiver entre o início e o fim
    return atual >= inicio && atual <= fim;
  }

  /**
   * Retorna a turma que ocupa uma sala em um determinado turno,
   * respeitando a seguinte prioridade:
   *
   *   1º — Alocação TEMPORÁRIA que bate com o semestre selecionado
   *         → aparece mesmo que a turma esteja fora do período letivo
   *
   *   2º — Alocação DEFINITIVA cuja turma esteja no período letivo
   *         → desaparece automaticamente quando a turma se forma
   *
   * Retorna null se a sala estiver livre no turno.
   */
  function turmaPorSalaETurno(salaId, turno) {
    // Filtra apenas as alocações da sala e turno específicos
    const alocacoesFiltradas = alocacoes.filter(
      (a) =>
        Number(a.sala_id) === Number(salaId) &&
        a.turno?.toLowerCase() === turno.toLowerCase(),
    );

    // ── Prioridade 1: Temporário ──────────────────────────────────────────
    // Busca alocação temporária que seja exatamente do semestre selecionado
    const alocacaoTemp = alocacoesFiltradas.find(
      (a) =>
        a.time_alocacao === "temporario" &&
        Number(a.ano_temp) === Number(anoSelecionado) &&
        Number(a.semestre_temp) === Number(semestreSelecionado),
    );

    if (alocacaoTemp) {
      // Encontrou temporário: busca a turma e retorna sem verificar período letivo
      const turma = turmas.find(
        (t) => Number(t.id) === Number(alocacaoTemp.turma_id),
      );
      return turma || null;
    }

    // ── Prioridade 2: Definitivo ──────────────────────────────────────────
    // Busca alocação definitiva que esteja vigente no período selecionado
    const alocacaoDefinitiva = alocacoesFiltradas.find((a) => {
      if (a.time_alocacao !== "definitivo") return false;
      
      // Busca a turma e verifica se está no período letivo
      const turma = turmas.find((t) => Number(t.id) === Number(a.turma_id));
      if (!turma) return false;
      
      return turmaEstaAtiva(turma);
    });

    // Sala livre neste turno
    if (!alocacaoDefinitiva) return null;

    // Retorna a turma da alocação definitiva que está ativa
    return turmas.find(
      (t) => Number(t.id) === Number(alocacaoDefinitiva.turma_id),
    ) || null;
  }

  // ─── Cálculo de Estatísticas ───────────────────────────────────────────────
  const turmasAlocadas = new Set();
  const turmasLivres = salas.length * 3; // Total de vagas (3 turnos por sala)

  let totalTurmasOcupadas = 0;
  salas.forEach((sala) => {
    [
      turmaPorSalaETurno(sala.id, "manhã"),
      turmaPorSalaETurno(sala.id, "tarde"),
      turmaPorSalaETurno(sala.id, "noite"),
    ].forEach((turma) => {
      if (turma) {
        turmasAlocadas.add(turma.id);
        totalTurmasOcupadas++;
      }
    });
  });

  const totalVagas = turmasLivres;
  const vagasLivres = totalVagas - totalTurmasOcupadas;
  const percentualOcupacao = Math.round((totalTurmasOcupadas / totalVagas) * 100);

  // Adicione essa função helper dentro do componente:
  function corProgresso(percentual) {
    if (percentual >= 80) return "alto";
    if (percentual >= 50) return "medio";
    return "baixo";
  }

  return (
    <div className="tabela-container">
      {/* ───────── CAIXA DA TABELA ───────── */}
      <div className="tabela-card">
        {/* HEADER DENTRO DA CAIXA */}
        <div className="tabela-header">
          <div className="tabela-header-left">
            <h2 className="tabela-title">Alocações de Salas</h2>
            <span className="tabela-badge">{salas.length} salas</span>
          </div>

          <div className="tabela-filters">
            <select
              className="filter-select"
              value={anoSelecionado}
              onChange={(e) => setAnoSelecionado(Number(e.target.value))}
            >
              {[
                2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030,
                2031,
              ].map((ano) => (
                <option key={ano} value={ano}>
                  {ano}
                </option>
              ))}
            </select>

            <select
              className="filter-select"
              value={semestreSelecionado}
              onChange={(e) => setSemestreSelecionado(Number(e.target.value))}
            >
              <option value={1}>1º semestre</option>
              <option value={2}>2º semestre</option>
            </select>
          </div>
        </div>

        <div className="tabela-divider" />

        {/* TABELA */}
        <div className="table-wrapper">
          <table className="tabela-alocacoes">
            <thead>
              <tr>
                <th>Sala</th>
                <th>Tipo</th>
                <th className="center">Manhã</th>
                <th className="center">Tarde</th>
                <th className="center">Noite</th>
              </tr>
            </thead>

            <tbody>
              {salas.map((sala) => {
                const turmaManha = turmaPorSalaETurno(sala.id, "manhã");
                const turmaTarde = turmaPorSalaETurno(sala.id, "tarde");
                const turmaNoite = turmaPorSalaETurno(sala.id, "noite");

                const renderTurno = (turma) => {
                  if (!turma) {
                    return <span className="vaga-livre">Livre</span>;
                  }

                  const pct = calcularPercentualTurma(turma);

                  return (
                    <div className="turma-box">
                      <span className="turma-name">{turma.nome}</span>

                      <span className="turma-period">
                        {turma.ano_inicio}.{turma.semestre_inicio}
                      </span>

                      <div className="turma-progress">
                        <div
                          className={`progress-mini ${corProgresso(pct)}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <span className="progress-label">{pct}%</span>
                    </div>
                  );
                };

                return (
                  <tr key={sala.id}>
                    <td>
                      <span className="sala-name">{sala.nome}</span>
                    </td>

                    <td>
                      <span className={`tag ${sala.tipoSala}`}>
                        {sala.tipoSala}
                      </span>
                    </td>

                    <td className="turno-cell">{renderTurno(turmaManha)}</td>

                    <td className="turno-cell">{renderTurno(turmaTarde)}</td>

                    <td className="turno-cell">{renderTurno(turmaNoite)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}