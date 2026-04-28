import { useState, useEffect } from "react";
import Header from "./components/header";
import ModalSalas from "./components/modalSalas";
import ModalCursos from "./components/modalCursos";
import ModalTurmas from "./components/modalTurmas";   
import ModalAlocacoes from "./components/modalAlocacao";
import TabelaAlocacoes from "./components/tabelaAlocacoes";
import TabelaAlocacaoDisciplinas from "./components/tabelaAlocacaoDisciplinas";
import ModalConflitoAlocacao from "./components/modalConflitoAlocacao";
import ModalProfessores from "./components/modalProfessores";
import ModalDisciplinas from "./components/modalDisciplinas";
import ModalAlocacaoPeriodo from "./components/modalAlocacaoPeriodo";

import Sidebar from "./components/sidebar";
import API_BASE from "./config/api";
import "./App.css";
import "./style/tableToggle.css";

function App() {
  const [menuAtivo, setMenuAtivo] = useState("gerenciamento");
  const [modalSalasAberto, setModalSalasAberto] = useState(false);
  const [modalCursosAberto, setModalCursosAberto] = useState(false);
  const [modalTurmasAberto, setModalTurmasAberto] = useState(false);
  const [modalAlocacoesAberto, setModalAlocacoesAberto] = useState(false);
  const [modalProfessoresAberto, setModalProfessoresAberto] = useState(false);
  const [modalDisciplinasAberto, setModalDisciplinasAberto] = useState(false);
  const [modalAlocacaoPeriodoAberto, setModalAlocacaoPeriodoAberto] = useState(false);

  const [salas, setSalas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alocacoes, setAlocacoes] = useState([]);
  const [professores, setProfessores] = useState([]);
  const [disciplinas, setDisciplinas] = useState([]);
  const [cursoDisciplinas, setCursoDisciplinas] = useState([]);
  const [alocacoesDisciplinas, setAlocacoesDisciplinas] = useState([]);

  // Estado para controlar qual tabela exibir
  const [tabelaAtiva, setTabelaAtiva] = useState("disciplinas"); // "salas" ou "disciplinas"

  // ============================================================
  // CARREGAMENTO INICIAL DOS DADOS DA API
  // ============================================================
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [
        salasRes, cursosRes, turmasRes, alocacoesRes, 
        professoresRes, disciplinasRes, cursoDisciplinasRes, alocacoesDisciplinasRes
      ] = await Promise.all([
        fetch(`${API_BASE}/salas`),
        fetch(`${API_BASE}/cursos`),
        fetch(`${API_BASE}/turmas`),
        fetch(`${API_BASE}/alocacoes`),
        fetch(`${API_BASE}/professores`),
        fetch(`${API_BASE}/disciplinas`),
        fetch(`${API_BASE}/curso-disciplinas`),
        fetch(`${API_BASE}/alocacoes-disciplinas`),
      ]);

      if (salasRes.ok) setSalas(await salasRes.json());
      if (cursosRes.ok) setCursos(await cursosRes.json());
      if (turmasRes.ok) setTurmas(await turmasRes.json());
      if (alocacoesRes.ok) setAlocacoes(await alocacoesRes.json());
      if (professoresRes.ok) setProfessores(await professoresRes.json());
      if (disciplinasRes.ok) setDisciplinas(await disciplinasRes.json());
      if (cursoDisciplinasRes.ok) setCursoDisciplinas(await cursoDisciplinasRes.json());
      if (alocacoesDisciplinasRes.ok) setAlocacoesDisciplinas(await alocacoesDisciplinasRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados iniciais:", err);
    }
  }

  // ============================================================
  // SINCRONIZAÇÃO AUTOMÁTICA: Quando Salas/Turmas/Cursos mudam,
  // recarrega as alocações removendo referências inválidas
  // ============================================================
  useEffect(() => {
    // Remove alocações órfãs (que referenciam entidades deletadas)
    const alocacoesValidas = alocacoes.filter((a) => {
      const turmaMantida = turmas.some((t) => t.id === a.turma_id);
      const salaMantida = salas.some((s) => s.id === a.sala_id);
      return turmaMantida && salaMantida;
    });

    if (alocacoesValidas.length !== alocacoes.length) {
      setAlocacoes(alocacoesValidas);
    }
  }, [salas, turmas]); // Dispara quando salas ou turmas mudam

  return (
    <div className="app-layout">
      <Sidebar menuAtivo={menuAtivo} setMenuAtivo={setMenuAtivo} />

      <div className="content">
        {menuAtivo === "central" && (
          <div>
            <Header
              title="Central IA"
              subtitle="Assistente inteligente do sistema"
            />
          </div>
        )}

        {menuAtivo === "gerenciamento" && (
          <>
            <Header
              title="Controle de Salas e Turmas"
              subtitle="Gerencie as salas, turmas e alocações de forma fácil e rápida"
            />

            <div className="container-fluid mt-4">
              <div className="card shadow-sm">
                <div className="card-body">
                  <div className="d-flex justify-content-end flex-wrap gap-2">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setModalSalasAberto(true)}
                    >
                      Salas
                    </button>

                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setModalCursosAberto(true)}
                    >
                      Cursos
                    </button>

                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setModalTurmasAberto(true)}
                    >
                      Turmas
                    </button>

                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setModalProfessoresAberto(true)}
                    >
                      Professores
                    </button>

                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setModalDisciplinasAberto(true)}
                    >
                      Disciplinas
                    </button>
                    
                    {/* Botão de Nova Alocação Dinâmico */}
                    {tabelaAtiva === "salas" ? (
                      <button
                        className="btn btn-primary shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #2563eb, #1d4ed8)",
                          border: "none",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={() => setModalAlocacoesAberto(true)}
                      >
                        <span style={{ fontSize: "1.2rem", lineHeight: 0 }}>+</span> Alocar Turmas
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary shadow-sm"
                        style={{
                          background: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
                          border: "none",
                          fontWeight: "600",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px"
                        }}
                        onClick={() => setModalAlocacaoPeriodoAberto(true)}
                      >
                        <span style={{ fontSize: "1.2rem", lineHeight: 0 }}>+</span> Alocar Período
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTROLE DE ALTERNÂNCIA ENTRE TABELAS */}
            <div className="table-toggle-container">
              <div className="table-toggle-wrapper" data-active={tabelaAtiva}>
                <div className="table-toggle-slider" />
                <button 
                  className={`table-toggle-btn ${tabelaAtiva === "salas" ? "active" : ""}`}
                  onClick={() => setTabelaAtiva("salas")}
                >
                  Visão por Salas
                </button>
                <button 
                  className={`table-toggle-btn ${tabelaAtiva === "disciplinas" ? "active" : ""}`}
                  onClick={() => setTabelaAtiva("disciplinas")}
                >
                  Visão por Grade Curricular
                </button>
              </div>
            </div>

            {/* RENDERIZAÇÃO DA TABELA ATIVA */}
            <div key={tabelaAtiva} className="table-animated-container">
              {tabelaAtiva === "salas" && (
                <TabelaAlocacoes
                  salas={salas}
                  turmas={turmas}
                  cursos={cursos}
                  alocacoes={alocacoes}
                />
              )}

              {tabelaAtiva === "disciplinas" && (
                <TabelaAlocacaoDisciplinas
                  salas={salas}
                  turmas={turmas}
                  alocacoesDisciplinas={alocacoesDisciplinas}
                />
              )}
            </div>

            {/* MODAL DE CONFLITOS FICA FORA DO ANIMATED CONTAINER */}
            {tabelaAtiva === "salas" && (
              <ModalConflitoAlocacao
                salas={salas}
                turmas={turmas}
                cursos={cursos}
                alocacoes={alocacoes}
              />
            )}

            {/* MODAIS (FICAM AQUI DENTRO DO GERENCIAMENTO) */}

            {modalSalasAberto && (
              <ModalSalas
                salas={salas}
                setSalas={setSalas}
                onClose={() => setModalSalasAberto(false)}
              />
            )}

            {modalCursosAberto && (
              <ModalCursos
                cursos={cursos}
                setCursos={setCursos}
                onClose={() => setModalCursosAberto(false)}
              />
            )}

            {modalTurmasAberto && (
              <ModalTurmas
                turmas={turmas}
                setTurmas={setTurmas}
                cursos={cursos}
                onClose={() => setModalTurmasAberto(false)}
              />
            )}

            {modalAlocacoesAberto && (
              <ModalAlocacoes
                turmas={turmas}
                salas={salas}
                alocacoes={alocacoes}
                setAlocacoes={setAlocacoes}
                onClose={() => setModalAlocacoesAberto(false)}
              />
            )}

            {modalProfessoresAberto && (
              <ModalProfessores
                professores={professores}
                setProfessores={setProfessores}
                cursos={cursos}
                onClose={() => setModalProfessoresAberto(false)}
              />
            )}

            {modalDisciplinasAberto && (
              <ModalDisciplinas
                disciplinas={disciplinas}
                setDisciplinas={setDisciplinas}
                cursos={cursos}
                cursoDisciplinas={cursoDisciplinas}
                setCursoDisciplinas={setCursoDisciplinas}
                onClose={() => setModalDisciplinasAberto(false)}
              />
            )}

            {modalAlocacaoPeriodoAberto && (
              <ModalAlocacaoPeriodo
                salas={salas}
                turmas={turmas}
                professores={professores}
                disciplinas={disciplinas}
                cursoDisciplinas={cursoDisciplinas}
                alocacoesDisciplinas={alocacoesDisciplinas}
                setAlocacoesDisciplinas={setAlocacoesDisciplinas}
                onClose={() => setModalAlocacaoPeriodoAberto(false)}
              />
            )}
          </>
        )}

        {menuAtivo === "metricas" && (
          <div>
            <Header title="Métricas" subtitle="Indicadores do sistema" />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
