import { useState } from "react";
import "../style/tabelaAlocacoes.css";

export default function TabelaAlocacaoDisciplinas({ salas, alocacoesDisciplinas }) {
  const [termoPesquisa, setTermoPesquisa] = useState("");

  function salaPassaFiltro(sala) {
    const termo = termoPesquisa.trim().toLowerCase();
    if (!termo) return true;

    // Pesquisar por nome da sala
    if (sala.nome.toLowerCase().includes(termo)) return true;

    // Pesquisar nas alocações da sala
    const alocsDaSala = alocacoesDisciplinas.filter(a => Number(a.sala_id) === Number(sala.id));
    return alocsDaSala.some(a => 
      a.turma_nome?.toLowerCase().includes(termo) ||
      a.disciplina_nome?.toLowerCase().includes(termo) ||
      a.professor_nome?.toLowerCase().includes(termo)
    );
  }

  const salasFiltradas = salas.filter(salaPassaFiltro);

  function formatarDataBR(dataIso) {
    if (!dataIso) return "";
    const [ano, mes, dia] = dataIso.split("T")[0].split("-");
    return `${dia}/${mes}`; // Ou `${dia}/${mes}/${ano}` se quiser com ano
  }

  return (
    <div className="tabela-container">
      <div className="tabela-card">
        {/* ── HEADER ── */}
        <div className="tabela-header">
          <div className="tabela-header-left">
            <h2 className="tabela-title">Alocação de Disciplinas</h2>
            <span className="tabela-badge">{salas.length} salas</span>
          </div>
        </div>

        {/* ── BARRA DE PESQUISA ── */}
        <div className="search-bar-wrapper">
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
              type="text"
              className="search-input"
              placeholder="Pesquisar por sala, turma, disciplina ou professor..."
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
        </div>

        <div className="tabela-divider" />

        {/* ── TABELA ── */}
        <div className="table-wrapper">
          <table className="tabela-alocacoes">
            <thead>
              <tr>
                <th style={{ width: '20%' }}>Sala</th>
                <th>Alocações de Disciplinas no Semestre</th>
              </tr>
            </thead>

            <tbody>
              {salasFiltradas.length > 0 ? (
                salasFiltradas.map((sala) => {
                  const alocsDaSala = alocacoesDisciplinas.filter(
                    (a) => Number(a.sala_id) === Number(sala.id)
                  );

                  return (
                    <tr key={sala.id}>
                      <td style={{ verticalAlign: 'top', paddingTop: '15px' }}>
                        <span className="sala-name">{sala.nome}</span>
                        <div style={{ marginTop: '5px' }}>
                          <span className={`tag ${sala.tipo_sala || sala.tipoSala}`}>
                            {sala.tipo_sala || sala.tipoSala || "Normal"}
                          </span>
                        </div>
                      </td>
                      <td>
                        {alocsDaSala.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '10px 0' }}>
                            {alocsDaSala.map(aloc => {
                              const inicioFormatado = formatarDataBR(aloc.data_inicio);
                              const fimFormatado = formatarDataBR(aloc.data_fim);
                              const temIntervalo = inicioFormatado && fimFormatado;
                              
                              return (
                                <div key={aloc.id} style={{ 
                                  padding: '12px', 
                                  backgroundColor: '#f8f9fa', 
                                  borderLeft: '4px solid #2196f3',
                                  borderRadius: '4px',
                                  fontSize: '14px'
                                }}>
                                  <strong>Turma {aloc.turma_nome}</strong> terá aula de <strong>{aloc.disciplina_nome}</strong> nas <strong>{aloc.dia_semana.toLowerCase()}s</strong>
                                  {temIntervalo && ` no intervalo de ${inicioFormatado} até ${fimFormatado}`}
                                  {aloc.is_modular && (
                                    <span style={{ 
                                      marginLeft: '8px', 
                                      backgroundColor: '#ff9800', 
                                      color: 'white', 
                                      padding: '2px 6px', 
                                      borderRadius: '12px',
                                      fontSize: '11px',
                                      fontWeight: 'bold'
                                    }}>
                                      MODULAR
                                    </span>
                                  )}
                                  {aloc.professor_nome && (
                                    <div style={{ marginTop: '4px', color: '#666', fontSize: '13px' }}>
                                      Professor(a): {aloc.professor_nome}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="vaga-livre" style={{ display: 'inline-block', margin: '15px 0' }}>Livre</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={2} className="empty-search-row">
                    <div className="empty-search-content">
                      <p>Nenhuma sala correspondente à pesquisa.</p>
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
