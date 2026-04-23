import { useState, useRef } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalDisciplinas({ disciplinas, setDisciplinas, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [pesquisa, setPesquisa] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para a disciplina.");
      return false;
    }
    return true;
  }

  function iniciarEdicao(disciplina) {
    setEditandoId(disciplina.id);
    setNome(disciplina.nome);
    setCursoId(disciplina.curso_id || "");
    
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

    const disciplinaAtualizada = {
      nome: nome.trim(),
      curso_id: cursoId ? Number(cursoId) : null,
    };

    try {
      const response = await fetch(`${API_BASE}/disciplinas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(disciplinaAtualizada),
      });

      if (!response.ok) throw new Error(await response.text());

      const disciplinaEditada = await response.json();

      setDisciplinas((prev) =>
        prev.map((d) => (d.id === editandoId ? disciplinaEditada : d)),
      );

      setEditandoId(null);
      limparFormulario();
      success("Disciplina atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao editar disciplina:", err);
      error("Não foi possível editar a disciplina: " + err.message);
    }
  }

  async function adicionarDisciplina() {
    if (!validarEntrada()) return;

    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novaDisciplina = {
      nome: nome.trim(),
      curso_id: cursoId ? Number(cursoId) : null,
    };

    try {
      const response = await fetch(`${API_BASE}/disciplinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaDisciplina),
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || "Erro ao adicionar disciplina");
      }

      const disciplinaCriada = await response.json();
      setDisciplinas((prev) => [...prev, disciplinaCriada]);
      limparFormulario();
      success("Disciplina adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar disciplina:", err.message);
      error("Erro ao adicionar disciplina: " + err.message);
    }
  }

  async function removerDisciplina(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(`${API_BASE}/disciplinas/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setDisciplinas((prev) => prev.filter((d) => d.id !== id));
          success("Disciplina removida com sucesso!");
        } catch (err) {
          console.error("Erro ao remover disciplina:", err.message);
          error("Não foi possível remover the disciplina: Ela pode estar alocada a uma turma.");
        }
      },
      null,
      "Excluir disciplina?"
    );
  }

  function limparFormulario() {
    setNome("");
    setCursoId("");
  }

  const disciplinasFiltradas = disciplinas.filter((d) =>
    d.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar Disciplina" : "Gerenciar Disciplinas"}</h2>
            <span className="modal-badge">{disciplinas.length} cadastradas</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando disciplina — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome da disciplina</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Banco de Dados"
              />
            </div>
            <div className="form-group full">
              <label>Curso (Opcional)</label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
              >
                <option value="">Geral (Sem curso específico)</option>
                {cursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarDisciplina}>
              + Adicionar disciplina
            </button>
          )}

          <div className="modal-divider" />

          {disciplinas.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar disciplinas..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {disciplinas.length === 0 ? (
            <p className="lista-feedback">Nenhuma disciplina cadastrada.</p>
          ) : disciplinasFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma disciplina encontrada.</p>
          ) : (
            <ul className="lista-cursos">
              {disciplinasFiltradas.map((d) => {
                const cursoNome = d.curso_id ? cursos.find(c => c.id === d.curso_id)?.nome : "Geral";
                return (
                  <li
                    key={d.id}
                    className={`item-curso ${editandoId === d.id ? "item-editando" : ""}`}
                  >
                    <div className="item-info">
                      <span className="item-nome">{d.nome}</span>
                      <div className="item-meta">
                        <span className="pill">{cursoNome}</span>
                      </div>
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn-edit"
                        onClick={() => iniciarEdicao(d)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => removerDisciplina(d.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  </li>
                );
              })}
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
