import { useState, useEffect } from "react";
import "../style/modalCursos.css";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalCursos({ cursos, setCursos, onClose, onDataChange }) {
  const [nome, setNome] = useState("");
  const [vagas, setVagas] = useState(40);
  const [semestres, setSemestres] = useState(8);
  const [carregando, setCarregando] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const { alert, showAlert, showConfirm, error, success } = useAlert();

  useEffect(() => {
    carregarCursos();
  }, []);

  async function carregarCursos() {
    try {
      const response = await fetch(`${API_BASE}/cursos`);
      if (!response.ok) throw new Error("Erro na resposta da API");
      const data = await response.json();
      setCursos(data);
      setModoOffline(false);
    } catch (err) {
      console.error("Erro ao buscar cursos:", err);
      setModoOffline(true);
    } finally {
      setCarregando(false);
    }
  }

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para o curso.");
      return false;
    }
    if (vagas <= 0 || isNaN(vagas)) {
      error("Por favor, insira uma quantidade válida de vagas.");
      return false;
    }
    if (semestres <= 0 || isNaN(semestres)) {
      error("Por favor, insira uma quantidade válida de semestres.");
      return false;
    }
    return true;
  }

  async function adicionarCurso() {
    if (!validarEntrada()) return;

    const novoCurso = {
      nome: nome.trim(),
      vagas: Number(vagas),
      semestres: Number(semestres),
    };

    if (modoOffline) {
      const cursoTemp = { ...novoCurso, id: Date.now() };
      setCursos((prev) => [...prev, cursoTemp]);
      showAlert("Curso adicionado apenas localmente (modo offline).", "Modo Offline");
      limparFormulario();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/cursos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoCurso),
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || "Erro ao adicionar curso");
      }

      const cursoCriado = await response.json();
      setCursos((prev) => [...prev, cursoCriado]);
      limparFormulario();
      success("Curso adicionado com sucesso!");
      onDataChange?.();
    } catch (err) {
      console.error("Erro ao adicionar curso:", err.message);
      error("Erro ao adicionar curso: " + err.message);
    }
  }

  async function removerCurso(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        if (modoOffline) {
          setCursos((prev) => prev.filter((c) => c.id !== id));
          showAlert("Curso removido apenas localmente (modo offline).", "Modo Offline");
          return;
        }

        try {
          const response = await fetch(`${API_BASE}/cursos/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setCursos((prev) => prev.filter((c) => c.id !== id));
          success("Curso removido com sucesso!");
          onDataChange?.();
        } catch (err) {
          console.error("Erro ao remover curso:", err.message);
          error("Não foi possível remover o curso: " + err.message);
        }
      },
      null,
      "Excluir curso?"
    );
  }

  function limparFormulario() {
    setNome("");
    setVagas(40);
    setSemestres(8);
  }

  const cursosFiltrados = cursos.filter((curso) =>
    curso.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2>Gerenciar cursos</h2>
          <div className="header-right">
            <span className="modal-badge">{cursos.length} cadastrados</span>
            <button className="btn-close-icon" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Banner offline */}
          {modoOffline && (
            <div className="offline-badge">
              <span className="offline-dot" />
              API indisponível — exibindo dados locais
            </div>
          )}

          {/* Formulário */}
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome do curso</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Engenharia Ambiental"
              />
            </div>

            <div className="form-group">
              <label>Vagas</label>
              <input
                type="number"
                value={vagas}
                onChange={(e) => setVagas(Number(e.target.value))}
                step="10"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Semestres</label>
              <input
                type="number"
                value={semestres}
                onChange={(e) => setSemestres(Number(e.target.value))}
                step="2"
                min="1"
              />
            </div>
          </div>

          <button className="btn-primary" onClick={adicionarCurso}>
            + Adicionar curso
          </button>

          <div className="modal-divider" />

          {/* Barra de pesquisa */}
          {cursos.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar cursos..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* Lista */}
          {carregando ? (
            <p className="lista-feedback">Carregando cursos...</p>
          ) : cursos.length === 0 ? (
            <p className="lista-feedback">Nenhum curso cadastrado.</p>
          ) : cursosFiltrados.length === 0 ? (
            <p className="lista-feedback">Nenhum curso encontrado.</p>
          ) : (
            <ul className="lista-cursos">
              {cursosFiltrados.map((curso) => (
                <li key={curso.id} className="item-curso">
                  <div className="item-info">
                    <span className="item-nome">{curso.nome}</span>
                    <div className="item-meta">
                      <span className="pill vagas">{curso.vagas} vagas</span>
                      <span className="pill semestres">
                        {curso.semestres} semestres
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => removerCurso(curso.id)}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <AlertModal
        visible={alert.visible}
        type={alert.type}
        title={alert.title}
        message={alert.message}
        confirmText={alert.confirmText}
        cancelText={alert.cancelText}
        onConfirm={alert.onConfirm}
        onCancel={alert.onCancel}
      />
    </div>
  );
}
