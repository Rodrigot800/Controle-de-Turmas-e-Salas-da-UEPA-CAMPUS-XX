import { useState } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalProfessores({ professores, setProfessores, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [pesquisa, setPesquisa] = useState("");

  const [editandoId, setEditandoId] = useState(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para o professor.");
      return false;
    }
    if (!cursoId) {
      error("Por favor, selecione um curso.");
      return false;
    }
    return true;
  }

  function iniciarEdicao(professor) {
    setEditandoId(professor.id);
    setNome(professor.nome);
    setCursoId(professor.curso_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvarEdicao() {
    if (!validarEntrada()) return;

    const professorAtualizado = {
      nome: nome.trim(),
      curso_id: Number(cursoId),
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
      curso_id: Number(cursoId),
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
          error("Não foi possível remover o professor: " + err.message);
        }
      },
      null,
      "Excluir professor?"
    );
  }

  function limparFormulario() {
    setNome("");
    setCursoId("");
  }

  function getNomeCurso(id) {
    const curso = cursos.find(c => c.id === id);
    return curso ? curso.nome : "Desconhecido";
  }

  const professoresFiltrados = professores.filter((professor) =>
    professor.nome.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar professor" : "Gerenciar professores"}</h2>
            <span className="modal-badge">{professores.length} cadastrados</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando professor — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>Cancelar</button>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome do Professor</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="form-group full">
              <label>Curso</label>
              <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                <option value="">Selecione o curso</option>
                {cursos.map(c => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>Salvar alterações</button>
          ) : (
            <button className="btn-primary" onClick={adicionarProfessor}>+ Adicionar professor</button>
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
              {professoresFiltrados.map((professor) => (
                <li key={professor.id} className={`item-curso ${editandoId === professor.id ? "item-editando" : ""}`}>
                  <div className="item-info">
                    <span className="item-nome">{professor.nome}</span>
                    <div className="item-meta">
                      <span className="pill">Curso: {getNomeCurso(professor.curso_id)}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => iniciarEdicao(professor)}>Editar</button>
                    <button className="btn-delete" onClick={() => removerProfessor(professor.id)}>Excluir</button>
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
