import { useState, useEffect } from "react";
import Header from "./components/header";
import ModalSalas from "./components/modalSalas";
import ModalCursos from "./components/modalCursos";
import ModalTurmas from "./components/modalTurmas";   
import ModalAlocacoes from "./components/modalAlocacao";
import TabelaAlocacoes from "./components/tabelaAlocacoes";
import Sidebar from "./components/sidebar";
import "./App.css";

function App() {
  const [menuAtivo, setMenuAtivo] = useState("gerenciamento");
  const [modalSalasAberto, setModalSalasAberto] = useState(false);
  const [modalCursosAberto, setModalCursosAberto] = useState(false);
  const [modalTurmasAberto, setModalTurmasAberto] = useState(false);
  const [modalAlocacoesAberto, setModalAlocacoesAberto] = useState(false);

  const [salas, setSalas] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [turmas, setTurmas] = useState([]);
  const [alocacoes, setAlocacoes] = useState([]);

  // ============================================================
  // CARREGAMENTO INICIAL DOS DADOS DA API
  // ============================================================
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [salasRes, cursosRes, turmasRes, alocacoesRes] = await Promise.all([
        fetch("http://localhost:3001/salas"),
        fetch("http://localhost:3001/cursos"),
        fetch("http://localhost:3001/turmas"),
        fetch("http://localhost:3001/alocacoes"),
      ]);

      if (salasRes.ok) setSalas(await salasRes.json());
      if (cursosRes.ok) setCursos(await cursosRes.json());
      if (turmasRes.ok) setTurmas(await turmasRes.json());
      if (alocacoesRes.ok) setAlocacoes(await alocacoesRes.json());
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
                      onClick={() => setModalAlocacoesAberto(true)}
                    >
                      Alocações
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <TabelaAlocacoes
              salas={salas}
              turmas={turmas}
              cursos={cursos}
              alocacoes={alocacoes}
            />

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
