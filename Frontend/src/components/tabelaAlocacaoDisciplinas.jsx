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

export default function TabelaAlocacaoDisciplinas({ salas, turmas = [], alocacoesDisciplinas }) {
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
      .sort((a, b) => a.salaNome.localeCompare(b.salaNome))
      .map(sala => {
        const turmasArray = Object.values(sala.mapaTurmas)
          .sort((a, b) => a.turmaNome.localeCompare(b.turmaNome));
        return {
          salaNome: sala.salaNome,
          totalAlocacoesSala: sala.totalAlocacoesSala,
          turmas: turmasArray
        };
      });
  }, [alocacoesDisciplinas, termoPesquisa, filtroTurno]);

  return (
    <div className="grade-container">
      <div className="grade-card">
        
        {/* ── HEADER E PESQUISA ── */}
        <div className="grade-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 className="grade-title">Alocações de Disciplinas{filtroTurno ? ` — ${filtroTurno}` : ""}</h2>
            <span className="grade-badge">{salasAgrupadas.length} salas alocadas</span>
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            <div className="grade-search-wrapper" style={{ width: 'auto' }}>
              <select 
                className="grade-search-input" 
                style={{ paddingLeft: '12px', cursor: 'pointer', appearance: 'auto' }}
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
          </div>
        </div>

        {/* ── TABELA ── */}
        <div className="grade-table-wrapper">
          <table className="grade-table">
            <thead>
              <tr>
                <th style={{ width: '15%' }} className="txt-center">Sala</th>
                <th style={{ width: '15%' }} className="txt-center">Turma</th>
                <th style={{ width: '20%' }}>Professor</th>
                <th style={{ width: '25%' }}>Disciplina</th>
                <th style={{ width: '25%' }}>Período</th>
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
                          
                          {/* Dados da Disciplina */}
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            {aloc.professor_nome ? (
                              aloc.professor_nome
                            ) : (
                              <span className="txt-cinza">A definir</span>
                            )}
                          </td>
                          
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            <strong>{aloc.disciplina_nome}</strong>
                          </td>
                          
                          <td className={!isPrimeiraAlocacaoDaTurma ? "cell-bordered-top" : ""}>
                            <div className="periodo-wrapper">
                              {periodoTexto && <span className="periodo-data">{periodoTexto}</span>}
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
                  <td colSpan="5" className="txt-center p-4">
                    <span className="txt-cinza">Nenhuma alocação correspondente à pesquisa.</span>
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
