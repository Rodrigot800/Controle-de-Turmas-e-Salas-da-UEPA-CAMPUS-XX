import { useState } from "react";
import "../style/tabelaAlocacoes.css";

export default function TabelaAlocacoes({ salas, turmas, cursos, alocacoes, onOpenModalAlocacao }) {
  // ─── Filtros de semestre ───────────────────────────────────────────────────
  const [anoSelecionado, setAnoSelecionado] = useState(2026);
  const [semestreSelecionado, setSemestreSelecionado] = useState(1);

  // ─── Filtro de pesquisa ────────────────────────────────────────────────────
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [tipoPesquisa, setTipoPesquisa] = useState("turma"); // "turma" | "ano"

  // ─── Funções auxiliares ────────────────────────────────────────────────────
  function semestreAbsoluto(ano, semestre) {
    return Number(ano) * 2 + (Number(semestre) === 2 ? 1 : 0);
  }

  function calcularPercentualTurma(turma) {
    const curso = cursos.find((c) => Number(c.id) === Number(turma.curso_id));
    if (!curso) return 0;

    const inicio = semestreAbsoluto(turma.ano_inicio, turma.semestre_inicio);
    const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);
    const duracao = Number(curso.semestres);

    const semestresCursados = atual - inicio + 1;
    const percentual = Math.min(
      100,
      Math.max(0, (semestresCursados / duracao) * 100)
    );

    return Math.round(percentual);
  }

  function turmaEstaAtiva(turma) {
    const curso = cursos.find((c) => Number(c.id) === Number(turma.curso_id));
    if (!curso) return false;

    const inicio = semestreAbsoluto(turma.ano_inicio, turma.semestre_inicio);
    const fim = inicio + Number(curso.semestres) - 1;
    const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);

    return atual >= inicio && atual <= fim;
  }

  function turmaPorSalaETurno(salaId, turno) {
    const alocacoesFiltradas = alocacoes.filter(
      (a) =>
        Number(a.sala_id) === Number(salaId) &&
        a.turno?.toLowerCase() === turno.toLowerCase()
    );

    const alocacaoTemp = alocacoesFiltradas.find(
      (a) =>
        a.time_alocacao === "temporario" &&
        Number(a.ano_temp) === Number(anoSelecionado) &&
        Number(a.semestre_temp) === Number(semestreSelecionado)
    );

    if (alocacaoTemp) {
      const turma = turmas.find(
        (t) => Number(t.id) === Number(alocacaoTemp.turma_id)
      );
      return turma || null;
    }

    const alocacaoDefinitiva = alocacoesFiltradas.find((a) => {
      if (a.time_alocacao !== "definitivo") return false;
      const turma = turmas.find((t) => Number(t.id) === Number(a.turma_id));
      if (!turma) return false;
      return turmaEstaAtiva(turma);
    });

    if (!alocacaoDefinitiva) return null;

    return (
      turmas.find(
        (t) => Number(t.id) === Number(alocacaoDefinitiva.turma_id)
      ) || null
    );
  }

  // ─── Filtragem de salas pela pesquisa ─────────────────────────────────────
  /**
   * Verifica se uma sala deve aparecer com base no termo de pesquisa.
   * A busca verifica se QUALQUER turno da sala contém uma turma
   * que corresponde ao filtro selecionado (nome ou ano de início).
   */
  function salaPassaFiltro(sala) {
    const termo = termoPesquisa.trim().toLowerCase();

    // Sem pesquisa → mostra tudo
    if (!termo) return true;

    const turnos = ["manhã", "tarde", "noite"];

    // Verifica se algum turno da sala tem turma que bate com a pesquisa
    return turnos.some((turno) => {
      const turma = turmaPorSalaETurno(sala.id, turno);
      if (!turma) return false;

      if (tipoPesquisa === "turma") {
        return turma.nome.toLowerCase().includes(termo);
      }

      if (tipoPesquisa === "ano") {
        return String(turma.ano_inicio).includes(termo);
      }

      return false;
    });
  }

  const salasFiltradas = salas
    .filter(salaPassaFiltro)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { numeric: true }));

  // ─── Estatísticas ──────────────────────────────────────────────────────────
  const turmasAlocadas = new Set();
  let totalTurmasOcupadas = 0;

  salas.forEach((sala) => {
    ["manhã", "tarde", "noite"].forEach((turno) => {
      const turma = turmaPorSalaETurno(sala.id, turno);
      if (turma) {
        turmasAlocadas.add(turma.id);
        totalTurmasOcupadas++;
      }
    });
  });

  const totalVagas = salas.length * 3;
  const vagasLivres = totalVagas - totalTurmasOcupadas;
  const percentualOcupacao = Math.round(
    (totalTurmasOcupadas / totalVagas) * 100
  );

  function corProgresso(percentual) {
    if (percentual >= 80) return "alto";
    if (percentual >= 50) return "medio";
    return "baixo";
  }

  // ─── Ícone de tipo de sala ────────────────────────────────────────────────
  function iconeTag(tipo) {
    switch (tipo) {
      case "laboratorio":
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 3h6v7l4 9H5l4-9z" /><line x1="9" y1="3" x2="15" y2="3" />
          </svg>
        );
      case "informatica":
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        );
      default:
        return (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        );
    }
  }

  return (
    <div className="tabela-container">
      <div className="tabela-card">
        {/* ── HEADER UNIFICADO ── */}
        <div className="tabela-toolbar">
          {/* Título + Badge */}
          <h2 className="tabela-title">Relação de Turmas com salas</h2>
          <span className="tabela-badge">{salas.length} salas</span>

          {/* Separador visual */}
          <div className="toolbar-separator" />

          {/* Seletores de período */}
          <select
            className="filter-select"
            value={anoSelecionado}
            onChange={(e) => setAnoSelecionado(Number(e.target.value))}
          >
            {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031].map((ano) => (
              <option key={ano} value={ano}>{ano}</option>
            ))}
          </select>

          <select
            className="filter-select"
            value={semestreSelecionado}
            onChange={(e) => setSemestreSelecionado(Number(e.target.value))}
          >
            <option value={1}>1º sem</option>
            <option value={2}>2º sem</option>
          </select>

          {/* Separador visual */}
          <div className="toolbar-separator" />

          {/* Toggle tipo de pesquisa */}
          <div className="search-type-toggle">
            <button
              className={`search-type-btn ${tipoPesquisa === "turma" ? "active" : ""}`}
              onClick={() => { setTipoPesquisa("turma"); setTermoPesquisa(""); }}
            >
              Turma
            </button>
            <button
              className={`search-type-btn ${tipoPesquisa === "ano" ? "active" : ""}`}
              onClick={() => { setTipoPesquisa("ano"); setTermoPesquisa(""); }}
            >
              Ano
            </button>
          </div>

          {/* Campo de pesquisa */}
          <div className="search-input-wrapper">
            <svg
              className="search-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>

            <input
              type={tipoPesquisa === "ano" ? "number" : "text"}
              className="search-input"
              placeholder={tipoPesquisa === "turma" ? "Pesquisar turma..." : "Ano (ex: 2024)..."}
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
            />

            {termoPesquisa && (
              <button
                className="search-clear-btn"
                onClick={() => setTermoPesquisa("")}
                title="Limpar pesquisa"
              >
                ✕
              </button>
            )}
          </div>

          {/* Contador de resultados */}
          {termoPesquisa && (
            <span className="search-results-count">
              {salasFiltradas.length === 0
                ? "Nenhuma"
                : `${salasFiltradas.length} sala${salasFiltradas.length > 1 ? "s" : ""}`}
            </span>
          )}

          {/* Botão alocar */}
          <button
            className="toolbar-action-btn"
            onClick={onOpenModalAlocacao}
          >
            <span style={{ fontSize: "1.1rem", lineHeight: 0 }}>+</span> Alocar Turmas
          </button>
        </div>

        {/* ── TABELA ── */}
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
              {salasFiltradas.length > 0 ? (
                salasFiltradas.map((sala) => {
                  const turmaManha = turmaPorSalaETurno(sala.id, "manhã");
                  const turmaTarde = turmaPorSalaETurno(sala.id, "tarde");
                  const turmaNoite = turmaPorSalaETurno(sala.id, "noite");

                  const renderTurno = (turma) => {
                    if (!turma) {
                      return (
                        <span className="vaga-livre">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="8" y1="12" x2="16" y2="12" />
                          </svg>
                          Livre
                        </span>
                      );
                    }

                    const pct = calcularPercentualTurma(turma);

                    return (
                      <div className="turma-box">
                        <span className="turma-name">
                          {turma.nome}
                          <span className="turma-period">
                            ({turma.ano_inicio}.{turma.semestre_inicio})
                            <span className="progress-label"> {pct}%</span>
                          </span>
                        </span>

                        <div className="turma-progress">
                          <div
                            className={`progress-mini ${corProgresso(pct)}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
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
                          {iconeTag(sala.tipoSala)}
                          {sala.tipoSala}
                        </span>
                      </td>
                      <td className="turno-cell">{renderTurno(turmaManha)}</td>
                      <td className="turno-cell">{renderTurno(turmaTarde)}</td>
                      <td className="turno-cell">{renderTurno(turmaNoite)}</td>
                    </tr>
                  );
                })
              ) : (
                // Linha exibida quando nenhuma sala passa no filtro
                <tr>
                  <td colSpan={5} className="empty-search-row">
                    <div className="empty-search-content">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <p>
                        Nenhuma sala com turma correspondente a{" "}
                        <strong>"{termoPesquisa}"</strong>
                      </p>
                      <button
                        className="empty-clear-btn"
                        onClick={() => setTermoPesquisa("")}
                      >
                        Limpar pesquisa
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}