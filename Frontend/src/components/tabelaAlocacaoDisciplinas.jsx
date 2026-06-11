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

export default function TabelaAlocacaoDisciplinas({ salas, turmas = [], cursos = [], alocacoesDisciplinas, onOpenModalAlocacao }) {
  const dataAtual = new Date();
  const anoAtual = dataAtual.getFullYear();
  const mesAtual = dataAtual.getMonth() + 1;
  const semestreAtual = mesAtual <= 6 ? 1 : 2;

  const [anoSelecionado, setAnoSelecionado] = useState(anoAtual);
  const [semestreSelecionado, setSemestreSelecionado] = useState(semestreAtual);
  
  const [termoPesquisa, setTermoPesquisa] = useState("");
  const [apenasEmAndamento, setApenasEmAndamento] = useState(true);
  const [filtroTurno, setFiltroTurno] = useState(() => {
    const agora = new Date();
    const hora = agora.getHours();
    const min = agora.getMinutes();
    
    if (hora < 12 || (hora === 12 && min === 0)) return "Manhã";
    if (hora < 18 || (hora === 18 && min === 0)) return "Tarde";
    return "Noite";
  });

  const turnosUnicos = useMemo(() => {
    const turnos = alocacoesDisciplinas.map(a => a.turno).filter(Boolean);
    return [...new Set(turnos)].sort();
  }, [alocacoesDisciplinas]);

  // ─── Funções auxiliares p/ verificar se turma está ativa no semestre ───────
  function semestreAbsoluto(ano, semestre) {
    return Number(ano) * 2 + (Number(semestre) === 2 ? 1 : 0);
  }

  function turmaEstaAtiva(turma) {
    if (!cursos || cursos.length === 0) return true; // Se não houver cursos, exibe tudo por segurança
    const curso = cursos.find((c) => Number(c.id) === Number(turma.curso_id));
    if (!curso) return false;

    const inicio = semestreAbsoluto(turma.ano_inicio, turma.semestre_inicio);
    const fim = inicio + Number(curso.semestres) - 1;
    const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);

    return atual >= inicio && atual <= fim;
  }


  // Agrupa as alocações por Sala e depois por Turma
  const salasAgrupadas = useMemo(() => {
    const termo = termoPesquisa.trim().toLowerCase();
    
    // Filtro de pesquisa abrangente
    let alocsFiltradas = alocacoesDisciplinas;

    if (!apenasEmAndamento) {
      // Filtra pelo semestre/ano selecionado
      alocsFiltradas = alocsFiltradas.filter(a => {
        // Se a alocação possui data_inicio explícita, extraímos o ano e o semestre da data
        if (a.data_inicio) {
          // Garantindo que a data seja interpretada no fuso horário local corretamente (evitando shift de dia)
          const [anoStr, mesStr] = a.data_inicio.split('T')[0].split('-');
          const anoAloc = Number(anoStr);
          const mesAloc = Number(mesStr);
          const semestreAloc = mesAloc <= 6 ? 1 : 2;
          
          return anoAloc === Number(anoSelecionado) && semestreAloc === Number(semestreSelecionado);
        }
        
        // Fallback para turmas ativas caso a alocação não tenha data de início
        const turma = turmas.find(t => String(t.id) === String(a.turma_id));
        if (!turma) return false;
        return turmaEstaAtiva(turma);
      });
    } else {
      // Filtra apenas pelo momento atual (hoje)
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const mes = String(hoje.getMonth() + 1).padStart(2, '0');
      const dia = String(hoje.getDate()).padStart(2, '0');
      const hojeStr = `${ano}-${mes}-${dia}`;

      alocsFiltradas = alocsFiltradas.filter(a => {
        // Se não tem período definido, não pode estar em andamento
        if (!a.data_inicio && !a.data_fim) return false;

        const inicio = a.data_inicio ? a.data_inicio.split('T')[0] : null;
        const fim = a.data_fim ? a.data_fim.split('T')[0] : null;

        if (inicio && fim) {
          return hojeStr >= inicio && hojeStr <= fim;
        } else if (inicio) {
          return hojeStr >= inicio;
        } else if (fim) {
          return hojeStr <= fim;
        }
        return false;
      });
    }

    if (filtroTurno) {
      alocsFiltradas = alocsFiltradas.filter(a => a.turno === filtroTurno);
    }

    if (termo) {
      alocsFiltradas = alocsFiltradas.filter(a => {
        return (
          a.sala_nome?.toLowerCase().includes(termo) ||
          a.turma_nome?.toLowerCase().includes(termo) ||
          (a.disciplina_nome?.toLowerCase() || "optativa").includes(termo) ||
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
  }, [alocacoesDisciplinas, termoPesquisa, filtroTurno, anoSelecionado, semestreSelecionado, turmas, cursos, apenasEmAndamento]);

  // Conta total de alocações
  const totalAlocacoes = useMemo(() => {
    return salasAgrupadas.reduce((acc, s) => acc + s.totalAlocacoesSala, 0);
  }, [salasAgrupadas]);

  return (
    <div className="grade-container">
      <div className="grade-card">
        
        {/* ── TOOLBAR UNIFICADA ── */}
        <div className="grade-toolbar">
          
          {/* Linha Superior: Título + Badges à esquerda, Botão principal à direita */}
          <div className="grade-toolbar-top">
            <div className="grade-title-section">
              <h2 className="grade-title">
                Relação de turmas com disciplinas {filtroTurno ? ` — ${filtroTurno}` : ""}
              </h2>
              <div className="grade-badge-container">
                <span className="grade-badge">
                  {salasAgrupadas.length} {salasAgrupadas.length === 1 ? 'sala' : 'salas'}
                </span>
                {totalAlocacoes > 0 && (
                  <span className="grade-badge-accent">
                    {totalAlocacoes} {totalAlocacoes === 1 ? 'disciplina' : 'disciplinas'}
                  </span>
                )}
              </div>
            </div>

            <button
              className="grade-action-btn"
              onClick={onOpenModalAlocacao}
            >
              <span style={{ fontSize: "1.1rem", lineHeight: 0 }}>+</span> Alocar Período
            </button>
          </div>

          {/* Linha Inferior: Filtros à esquerda, Pesquisa à direita */}
          <div className="grade-toolbar-bottom">
            <div className="grade-filters-section">
              {/* Seletores de ano e semestre */}
              <select
                className="grade-filter-select"
                value={anoSelecionado}
                onChange={(e) => setAnoSelecionado(Number(e.target.value))}
                disabled={apenasEmAndamento}
                style={apenasEmAndamento ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={apenasEmAndamento ? "Filtros desabilitados pois 'Em andamento' está ativo" : "Filtrar por ano"}
              >
                {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031].map((ano) => (
                  <option key={ano} value={ano}>{ano}</option>
                ))}
              </select>

              <select
                className="grade-filter-select"
                value={semestreSelecionado}
                onChange={(e) => setSemestreSelecionado(Number(e.target.value))}
                disabled={apenasEmAndamento}
                style={apenasEmAndamento ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                title={apenasEmAndamento ? "Filtros desabilitados pois 'Em andamento' está ativo" : "Filtrar por semestre"}
              >
                <option value={1}>1º sem</option>
                <option value={2}>2º sem</option>
              </select>

              {/* Filtro de turno */}
              <select 
                className="grade-filter-select"
                value={filtroTurno}
                onChange={(e) => setFiltroTurno(e.target.value)}
              >
                <option value="">Todos os Turnos</option>
                {turnosUnicos.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Interruptor "Em Andamento Hoje" */}
              <div 
                className={`switch-wrapper ${apenasEmAndamento ? 'active' : ''}`}
                onClick={() => setApenasEmAndamento(!apenasEmAndamento)}
                title="Mostrar apenas alocações com período letivo ativo hoje"
              >
                <div className="switch-control">
                  <div className="switch-knob" />
                </div>
                <span className="switch-label">Em andamento hoje</span>
              </div>
            </div>

            {/* Campo de pesquisa */}
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
              {(() => {
                return salasAgrupadas.length > 0 ? (
                  salasAgrupadas.map((sala, salaIndex) => {
                    const isZebraSala = salaIndex % 2 === 1;
                    const salaBgClass = isZebraSala ? "tr-zebra-sala" : "tr-normal-sala";
                    let localRowCounter = 0; // Reseta a cada nova sala

                    return sala.turmas.map((turma) => {
                      return turma.alocacoes.map((aloc, aIdx) => {
                        const isPrimeiraAlocacaoDaSalaEfetiva = turma === sala.turmas[0] && aIdx === 0;
                        const isPrimeiraAlocacaoDaTurma = aIdx === 0;
                        const isModular = aloc.tipo_disciplina === "MODULAR";
                        
                        const isUltimaAlocacaoDaTurma = aIdx === turma.alocacoes.length - 1;
                        const isUltimaAlocacaoDaSala = turma === sala.turmas[sala.turmas.length - 1] && aIdx === turma.alocacoes.length - 1;

                        const rowParity = localRowCounter % 2 === 0 ? "row-even" : "row-odd";
                        localRowCounter++;

                        const boundaryClass = isUltimaAlocacaoDaSala ? 'ultimo-sala-row' : isUltimaAlocacaoDaTurma ? 'ultimo-turma-row' : '';
                        const trCustomClass = `${salaBgClass} ${rowParity} ${isModular ? 'modular-row' : 'semanal-row'} ${boundaryClass}`;
                        
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

                        return (
                          <tr key={aloc.id} className={trCustomClass}>
                            {isPrimeiraAlocacaoDaSalaEfetiva && (
                              <td rowSpan={sala.totalAlocacoesSala} className="cell-agrupada cell-sala">
                                {sala.salaNome}
                              </td>
                            )}

                            {isPrimeiraAlocacaoDaTurma && (
                              <td 
                                rowSpan={turma.alocacoes.length} 
                                className={`cell-agrupada cell-turma ${turma === sala.turmas[sala.turmas.length - 1] ? 'ultimo-turma-da-sala' : ''}`}
                              >
                                {turma.turmaNome}{turma.ano_inicio ? ` ${turma.ano_inicio}` : ""}
                              </td>
                            )}
                            
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
                            
                            <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <strong>{aloc.disciplina_nome || "Optativa"}</strong>
                                {aloc.reoferta && (
                                  <span className="badge-reoferta" style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    background: '#fffbeb',
                                    color: '#d97706',
                                    border: '1px solid #fde68a',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Reoferta
                                  </span>
                                )}
                                {aloc.optativa && (
                                  <span className="badge-optativa" style={{
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    background: '#f0fdfa',
                                    color: '#0d9488',
                                    border: '1px solid #99f6e4',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                  }}>
                                    Optativa
                                  </span>
                                )}
                              </div>
                            </td>
                            
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
                );
              })()}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}
