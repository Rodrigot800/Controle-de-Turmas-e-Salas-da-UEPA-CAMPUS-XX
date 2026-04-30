import { useState, useMemo } from "react";
import "../style/tabelaGrade.css";

// Formata data de 'YYYY-MM-DD...' para 'DD/MM'
function formatarDataBR(dataIso) {
  if (!dataIso) return "";
  const [ano, mes, dia] = dataIso.split("T")[0].split("-");
  return `${dia}/${mes}`;
}

const DIAS_SEMANA = {
  1: "segundas",
  2: "terças",
  3: "quartas",
  4: "quintas",
  5: "sextas",
  6: "sábados",
  0: "domingos"
};

function formatarDia(dia) {
  if (dia === null || dia === undefined) return "dia indefinido";
  if (typeof dia === "number" || !isNaN(Number(dia))) {
    return DIAS_SEMANA[Number(dia)] || `dia ${dia}`;
  }
  return dia.toLowerCase() + "s";
}

export default function TabelaAlocacaoDisciplinas({ salas, turmas = [], alocacoesDisciplinas, onOpenModalAlocacao }) {
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [filtroTurno, setFiltroTurno] = useState("");

  const turnosUnicos = useMemo(() => {
    const turnos = alocacoesDisciplinas.map(a => a.turno).filter(Boolean);
    return [...new Set(turnos)].sort();
  }, [alocacoesDisciplinas]);

  // Agrupa as alocações por Sala e depois por Turma
  const salasAgrupadas = useMemo(() => {
    const termo = termoPesquisa.trim().toLowerCase();
    
    // Filtro de pesquisa abrangente
    let alocsFiltradas = alocacoesDisciplinas;

    if (filtroTurno) {
      alocsFiltradas = alocsFiltradas.filter(a => a.turno === filtroTurno);
    }

    if (termo) {
      alocsFiltradas = alocsFiltradas.filter(a => {
        return (
          a.sala_nome?.toLowerCase().includes(termo) ||
          a.turma_nome?.toLowerCase().includes(termo) ||
          a.disciplina_nome?.toLowerCase().includes(termo) ||
          a.professor_nome?.toLowerCase().includes(termo)
        );
      });
    }

    const mapaSalas = {};

    // Primeiro agrupa por Sala
    alocsFiltradas.forEach(aloc => {
      const salaId = aloc.sala_id || "desconhecida";
      const turmaId = aloc.turma_id || "desconhecida";
      
      if (!mapaSalas[salaId]) {
        mapaSalas[salaId] = {
          salaNome: aloc.sala_nome || "Sala Desconhecida",
          totalAlocacoesSala: 0,
          mapaTurmas: {}
        };
      }
      
      if (!mapaSalas[salaId].mapaTurmas[turmaId]) {
        const turmaObj = turmas.find(t => String(t.id) === String(aloc.turma_id));
        mapaSalas[salaId].mapaTurmas[turmaId] = {
          turmaNome: aloc.turma_nome || "Turma Desconhecida",
          ano_inicio: turmaObj?.ano_inicio ?? aloc.ano_inicio ?? "",
          alocacoes: []
        };
      }
      
      mapaSalas[salaId].mapaTurmas[turmaId].alocacoes.push(aloc);
      mapaSalas[salaId].totalAlocacoesSala += 1;
    });

    // Converte os dicionários em arrays ordenados
    return Object.values(mapaSalas)
      .sort((a, b) => a.salaNome.localeCompare(b.salaNome, 'pt-BR', { numeric: true }))
      .map(sala => {
        const turmasArray = Object.values(sala.mapaTurmas)
          .sort((a, b) => a.turmaNome.localeCompare(b.turmaNome, 'pt-BR', { numeric: true }));
        return {
          salaNome: sala.salaNome,
          totalAlocacoesSala: sala.totalAlocacoesSala,
          turmas: turmasArray
        };
      });
  }, [alocacoesDisciplinas, termoPesquisa, filtroTurno]);

  // Conta total de alocações
  const totalAlocacoes = useMemo(() => {
    return salasAgrupadas.reduce((acc, s) => acc + s.totalAlocacoesSala, 0);
  }, [salasAgrupadas]);

  return (
    <div className="grade-container">
      <div className="grade-card">
        
        {/* ── HEADER E PESQUISA ── */}
        <div className="grade-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="grade-title">
              Alocações de Disciplinas
              {filtroTurno ? ` — ${filtroTurno}` : ""}
            </h2>
            <span className="grade-badge">
              {salasAgrupadas.length} {salasAgrupadas.length === 1 ? 'sala' : 'salas'}
            </span>
            {totalAlocacoes > 0 && (
              <span className="grade-badge" style={{ background: 'rgba(99,102,241,0.06)', color: '#6366f1', borderColor: 'rgba(99,102,241,0.15)' }}>
                {totalAlocacoes} {totalAlocacoes === 1 ? 'disciplina' : 'disciplinas'}
              </span>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div className="grade-search-wrapper" style={{ width: 'auto', maxWidth: 'none' }}>
              <select 
                className="grade-search-input" 
                style={{ paddingLeft: '12px', cursor: 'pointer', appearance: 'auto', fontWeight: 500 }}
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
              >
                <option value="">Todos os Turnos</option>
                {turnosUnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grade-search-wrapper">
              <svg className="grade-search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                type="text"
                className="grade-search-input"
                placeholder="Pesquisar sala, turma, professor..."
                value={termoPesquisa}
                onChange={(e) => setTermoPesquisa(e.target.value)}
              />
            </div>

            <button
              style={{
                background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
                border: "none",
                fontWeight: "700",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                color: "#fff",
                height: "36px",
                padding: "0 20px",
                fontSize: "13px",
                borderRadius: "10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 2px 8px rgba(139, 92, 246, 0.3)",
                transition: "all 0.25s ease",
                letterSpacing: "0.02em"
              }}
              onClick={onOpenModalAlocacao}
            >
              <span style={{ fontSize: "1.2rem", lineHeight: 0, marginTop: "-2px" }}>+</span> Alocar Período
            </button>
          </div>
        </div>

        {/* ── TABELA ── */}
        <div className="grade-table-wrapper">
          <table className="grade-table">
            <thead>
              <tr>
                <th style={{ width: '14%' }} className="txt-center">
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    </svg>
                    Sala
                  </span>
                </th>
                <th style={{ width: '14%' }} className="txt-center">
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    </svg>
                    Turma
                  </span>
                </th>
                <th style={{ width: '20%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                    Professor
                  </span>
                </th>
                <th style={{ width: '24%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Disciplina
                  </span>
                </th>
                <th style={{ width: '28%' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    Período
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {salasAgrupadas.length > 0 ? (
                salasAgrupadas.map((sala, salaIndex) => {
                  const isZebra = salaIndex % 2 === 0;
                  const bgClass = isZebra ? "tr-zebra" : "tr-normal";

                  return sala.turmas.map((turma, tIdx) => {
                    return turma.alocacoes.map((aloc, aIdx) => {
                      const isPrimeiraAlocacaoDaSala = tIdx === 0 && aIdx === 0;
                      const isPrimeiraAlocacaoDaTurma = aIdx === 0;
                      const isModular = aloc.tipo_disciplina === "MODULAR";
                      
                      const inicio = formatarDataBR(aloc.data_inicio);
                      const fim = formatarDataBR(aloc.data_fim);
                      let periodoTexto = "";
                      
                      if (inicio && fim) {
                        periodoTexto = `${inicio} a ${fim}`;
                      } else if (inicio) {
                        periodoTexto = `A partir de ${inicio}`;
                      } else if (fim) {
                        periodoTexto = `Até ${fim}`;
                      }

                      // A classe modular sobrepõe a zebra
                      const trCustomClass = isModular ? `${bgClass} modular-row` : bgClass;

                      return (
                        <tr key={aloc.id} className={trCustomClass}>
                          {/* Sala: rowspan igual ao total de alocações em TODAS as turmas dessa sala */}
                          {isPrimeiraAlocacaoDaSala && (
                            <td rowSpan={sala.totalAlocacoesSala} className="cell-agrupada cell-sala">
                              {sala.salaNome}
                            </td>
                          )}

                          {/* Turma: rowspan igual ao número de alocações nessa turma específica */}
                          {isPrimeiraAlocacaoDaTurma && (
                            <td rowSpan={turma.alocacoes.length} className="cell-agrupada cell-turma">
                              {turma.turmaNome}{turma.ano_inicio ? ` ${turma.ano_inicio}` : ""}
                            </td>
                          )}
                          
                          {/* Professor */}
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            {aloc.professor_nome ? (
                              <span style={{ fontWeight: 500 }}>{aloc.professor_nome}</span>
                            ) : (
                              <span className="txt-cinza" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
                                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                A definir
                              </span>
                            )}
                          </td>
                          
                          {/* Disciplina */}
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            <strong>{aloc.disciplina_nome}</strong>
                          </td>
                          
                          {/* Período */}
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            <div className="periodo-wrapper">
                              {periodoTexto && (
                                <span className="periodo-data">
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: '-2px', marginRight: '4px', opacity: 0.5 }}>
                                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
                                  </svg>
                                  {periodoTexto}
                                </span>
                              )}
                              {isModular ? (
                                <span className="badge-modular" title="Disciplina concentrada">MODULAR</span>
                              ) : (
                                <span className="badge-semanal" title="Aula regular na semana">
                                  às {formatarDia(aloc.dia_semana)}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  });
                })
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '64px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#94a3b8' }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                        <polyline points="2 17 12 22 22 17"></polyline>
                        <polyline points="2 12 12 17 22 12"></polyline>
                      </svg>
                      <p style={{ fontSize: '14px', color: '#64748b', margin: 0, fontWeight: 500 }}>
                        Nenhuma alocação correspondente à pesquisa.
                      </p>
                      {termoPesquisa && (
                        <button
                          onClick={() => setTermoPesquisa("")}
                          style={{
                            padding: '8px 20px',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            background: '#fff',
                            color: '#475569',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          Limpar pesquisa
                        </button>
                      )}
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
