import { useState, useEffect, useRef } from "react";
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
  const [mostrarCadastros, setMostrarCadastros] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Se o clique for dentro do modal, não fecha o dropdown
        if (event.target.closest('.modal') || event.target.closest('.modal-backdrop')) {
          return;
        }
        setMostrarCadastros(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
            >
              <div className="modern-dropdown-container" ref={dropdownRef}>
                <button
                  className="btn btn-primary shadow-sm d-flex align-items-center gap-2"
                  style={{ 
                    fontWeight: "600", 
                    fontSize: "14px",
                    transition: "all 0.3s ease",
                    background: mostrarCadastros ? "#1d4ed8" : "#2563eb",
                    border: "none",
                    padding: "25px 16px",
                    borderRadius: "8px"
                  
                  }}
                  onClick={() => setMostrarCadastros(!mostrarCadastros)}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Gerenciar Cadastros
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.3s ease", transform: mostrarCadastros ? "rotate(180deg)" : "rotate(0deg)" }}>
                    <path d="m6 9 6 6 6-6"/>
                  </svg>
                </button>

                {mostrarCadastros && (
                  <div className="modern-dropdown-menu" style={{ zIndex: 1000 }}>
                    <button
                      className="modern-dropdown-item"
                      onClick={() => { setModalSalasAberto(true); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                      Salas
                    </button>
                    
                    <button
                      className="modern-dropdown-item"
                      onClick={() => { setModalCursosAberto(true); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"></path><path d="M6 12v5c3 3 9 3 12 0v-5"></path></svg>
                      Cursos
                    </button>
                    
                    <button
                      className="modern-dropdown-item"
                      onClick={() => { setModalTurmasAberto(true); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                      Turmas
                    </button>
                    
                    <button
                      className="modern-dropdown-item"
                      onClick={() => { setModalProfessoresAberto(true); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                      Professores
                    </button>
                    
                    <button
                      className="modern-dropdown-item"
                      onClick={() => { setModalDisciplinasAberto(true); }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
                      Disciplinas
                    </button>
                  </div>
                )}
              </div>
            </Header>

            {/* ABAS COMO EXTENSÃO DA TABELA */}
            <div className="table-tabs-container">
              <button 
                className={`table-tab-btn ${tabelaAtiva === "salas" ? "active" : ""}`}
                onClick={() => setTabelaAtiva("salas")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                Alocação de Turmas 
              </button>
              <button 
                className={`table-tab-btn ${tabelaAtiva === "disciplinas" ? "active" : ""}`}
                onClick={() => setTabelaAtiva("disciplinas")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                Alocação de Disciplinas
              </button>
            </div>

            {/* RENDERIZAÇÃO DA TABELA ATIVA */}
            <div key={tabelaAtiva} className="table-animated-container">
              {tabelaAtiva === "salas" && (
                <TabelaAlocacoes
                  salas={salas}
                  turmas={turmas}
                  cursos={cursos}
                  alocacoes={alocacoes}
                  onOpenModalAlocacao={() => setModalAlocacoesAberto(true)}
                />
              )}

              {tabelaAtiva === "disciplinas" && (
                <TabelaAlocacaoDisciplinas
                  salas={salas}
                  turmas={turmas}
                  alocacoesDisciplinas={alocacoesDisciplinas}
                  onOpenModalAlocacao={() => setModalAlocacaoPeriodoAberto(true)}
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
