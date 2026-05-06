import { useState, useRef } from "react";
import "../style/modalCursos.css";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalCursos({ cursos, setCursos, onClose }) {
  const [nome, setNome] = useState("");
  const [vagas, setVagas] = useState(40);
  const [semestres, setSemestres] = useState(8);
  const [pesquisa, setPesquisa] = useState("");

  // Estados de edição
  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);
  const nomeInputRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

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

  // Preenche o formulário com os dados do curso e entra em modo edição
  function iniciarEdicao(curso) {
    setEditandoId(curso.id);
    setNome(curso.nome);
    setVagas(curso.vagas);
    setSemestres(curso.semestres);
    
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    setTimeout(() => {
      nomeInputRef.current?.focus();
    }, 150);
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvarEdicao() {
    if (!validarEntrada()) return;

    const cursoAtualizado = {
      nome: nome.trim(),
      vagas: Number(vagas),
      semestres: Number(semestres),
    };

    try {
      const response = await fetch(`${API_BASE}/cursos/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cursoAtualizado),
      });

      if (!response.ok) throw new Error(await response.text());

      const cursoEditado = await response.json();

      // Substitui o curso antigo pelo editado no estado
      setCursos((prev) =>
        prev.map((c) => (c.id === editandoId ? cursoEditado : c)),
      );

      setEditandoId(null);
      limparFormulario();
      success("Curso atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao editar curso:", err);
      error("Não foi possível editar the curso: " + err.message);
    }
  }

  async function adicionarCurso() {
    if (!validarEntrada()) return;

    // Se está editando, salva a edição em vez de adicionar
    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novoCurso = {
      nome: nome.trim(),
      vagas: Number(vagas),
      semestres: Number(semestres),
    };

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
    } catch (err) {
      console.error("Erro ao adicionar curso:", err.message);
      error("Erro ao adicionar curso: " + err.message);
    }
  }

  async function removerCurso(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(`${API_BASE}/cursos/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setCursos((prev) => prev.filter((c) => c.id !== id));
          success("Curso removido com sucesso!");
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
      <div className="modal" ref={modalRef}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar curso" : "Gerenciar cursos"}</h2>
            <span className="modal-badge">{cursos.length} cadastrados</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Banner de modo edição */}
          {editandoId && (
            <div className="edit-banner">
              <span>Editando curso — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}
          {/* Formulário */}
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome do curso</label>
              <input
                ref={nomeInputRef}
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

          {/* Botão muda conforme o modo */}
          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarCurso}>
              + Adicionar curso
            </button>
          )}

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
          {cursos.length === 0 ? (
            <p className="lista-feedback">Nenhum curso cadastrado.</p>
          ) : cursosFiltrados.length === 0 ? (
            <p className="lista-feedback">Nenhum curso encontrado.</p>
          ) : (
            <ul className="lista-cursos">
              {cursosFiltrados.map((curso) => (
                <li
                  key={curso.id}
                  className={`item-curso ${editandoId === curso.id ? "item-editando" : ""}`}
                >
                  <div className="item-info">
                    <span className="item-nome">{curso.nome}</span>
                    <div className="item-meta">
                      <span className="pill vagas">{curso.vagas} vagas</span>
                      <span className="pill semestres">
                        {curso.semestres} semestres
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => iniciarEdicao(curso)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => removerCurso(curso.id)}
                    >
                      Excluir
                    </button>
                  </div>
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
