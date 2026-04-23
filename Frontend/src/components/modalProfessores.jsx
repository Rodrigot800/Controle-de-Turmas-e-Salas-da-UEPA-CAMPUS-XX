import { useState, useRef } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalProfessores({ professores, setProfessores, onClose }) {
  const [nome, setNome] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para o professor.");
      return false;
    }
    return true;
  }

  function iniciarEdicao(professor) {
    setEditandoId(professor.id);
    setNome(professor.nome);
    
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvarEdicao() {
    if (!validarEntrada()) return;

    const professorAtualizado = {
      nome: nome.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/professores/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(professorAtualizado),
      });

      if (!response.ok) throw new Error(await response.text());

      const professorEditado = await response.json();

      setProfessores((prev) =>
        prev.map((p) => (p.id === editandoId ? professorEditado : p)),
      );

      setEditandoId(null);
      limparFormulario();
      success("Professor atualizado com sucesso!");
    } catch (err) {
      console.error("Erro ao editar professor:", err);
      error("Não foi possível editar o professor: " + err.message);
    }
  }

  async function adicionarProfessor() {
    if (!validarEntrada()) return;

    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novoProfessor = {
      nome: nome.trim(),
    };

    try {
      const response = await fetch(`${API_BASE}/professores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoProfessor),
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || "Erro ao adicionar professor");
      }

      const professorCriado = await response.json();
      setProfessores((prev) => [...prev, professorCriado]);
      limparFormulario();
      success("Professor adicionado com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar professor:", err.message);
      error("Erro ao adicionar professor: " + err.message);
    }
  }

  async function removerProfessor(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(`${API_BASE}/professores/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setProfessores((prev) => prev.filter((p) => p.id !== id));
          success("Professor removido com sucesso!");
        } catch (err) {
          console.error("Erro ao remover professor:", err.message);
          error("Não foi possível remover o professor: Ele pode estar alocado a uma disciplina.");
        }
      },
      null,
      "Excluir professor?"
    );
  }

  function limparFormulario() {
    setNome("");
  }

  const professoresFiltrados = professores.filter((prof) =>
    prof.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar Professor" : "Gerenciar Professores"}</h2>
            <span className="modal-badge">{professores.length} cadastrados</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando professor — preencha o nome e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome do professor</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João Silva"
              />
            </div>
          </div>

          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarProfessor}>
              + Adicionar professor
            </button>
          )}

          <div className="modal-divider" />

          {professores.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar professores..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {professores.length === 0 ? (
            <p className="lista-feedback">Nenhum professor cadastrado.</p>
          ) : professoresFiltrados.length === 0 ? (
            <p className="lista-feedback">Nenhum professor encontrado.</p>
          ) : (
            <ul className="lista-cursos">
              {professoresFiltrados.map((prof) => (
                <li
                  key={prof.id}
                  className={`item-curso ${editandoId === prof.id ? "item-editando" : ""}`}
                >
                  <div className="item-info">
                    <span className="item-nome">{prof.nome}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => iniciarEdicao(prof)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => removerProfessor(prof.id)}
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
