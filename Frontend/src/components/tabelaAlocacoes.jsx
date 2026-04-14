import { useState } from "react";

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
    // Só chega aqui se não houver temporário no semestre selecionado
    const alocacaoDefinitiva = alocacoesFiltradas.find(
      (a) => a.time_alocacao === "definitivo",
    );

    // Sala livre neste turno
    if (!alocacaoDefinitiva) return null;

    // Busca a turma da alocação definitiva
    const turma = turmas.find(
      (t) => Number(t.id) === Number(alocacaoDefinitiva.turma_id),
    );
    if (!turma) return null;

    // Só exibe a turma definitiva se ela ainda estiver no período letivo
    return turmaEstaAtiva(turma) ? turma : null;
  }
  return (
    <div className="container mt-4">
      {/* FILTROS */}
      <div className="d-flex justify-content-end gap-2 mb-3">
        <select
          className="form-select w-auto"
          value={anoSelecionado}
          onChange={(e) => setAnoSelecionado(e.target.value)}
        >
          {[
            2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031,
          ].map((ano) => (
            <option key={ano} value={ano}>
              {ano}
            </option>
          ))}
        </select>

        <select
          className="form-select w-auto"
          value={semestreSelecionado}
          onChange={(e) => setSemestreSelecionado(e.target.value)}
        >
          <option value={1}>1º Semestre</option>
          <option value={2}>2º Semestre</option>
        </select>
      </div>

      {/* TABELA */}
      <div className="table-responsive">
        <table className="table table-striped table-hover table-bordered align-middle text-center">
          <thead className="table-dark">
            <tr>
              <th>Sala</th>
              <th>Manhã</th>
              <th>Tarde</th>
              <th>Noite</th>
            </tr>
          </thead>

          <tbody>
            {salas.map((sala) => {
              const turmaManha = turmaPorSalaETurno(sala.id, "manhã");
              const turmaTarde = turmaPorSalaETurno(sala.id, "tarde");
              const turmaNoite = turmaPorSalaETurno(sala.id, "noite");

              return (
                <tr key={sala.id}>
                  <td className="fw-bold">{sala.nome}</td>

                  <td>
                    {turmaManha ? (
                      <span className="text-primary fw-semibold">
                        {turmaManha.nome} ({turmaManha.ano_inicio}.
                        {turmaManha.semestre_inicio})
                      </span>
                    ) : (
                      <span className="text-success fw-semibold">Livre</span>
                    )}
                  </td>

                  <td>
                    {turmaTarde ? (
                      <span className="text-primary fw-semibold">
                        {turmaTarde.nome} ({turmaTarde.ano_inicio}.
                        {turmaTarde.semestre_inicio})
                      </span>
                    ) : (
                      <span className="text-success fw-semibold">Livre</span>
                    )}
                  </td>

                  <td>
                    {turmaNoite ? (
                      <span className="text-primary fw-semibold">
                        {turmaNoite.nome} ({turmaNoite.ano_inicio}.
                        {turmaNoite.semestre_inicio})
                      </span>
                    ) : (
                      <span className="text-success fw-semibold">Livre</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
