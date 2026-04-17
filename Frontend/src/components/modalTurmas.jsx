import { useState } from "react";
import "../style/modalTurmas.css";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalTurmas({ turmas, setTurmas, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [turno, setTurno] = useState("");
  const [semestreInicio, setSemestreInicio] = useState(1);
  const [anoInicio, setAnoInicio] = useState(new Date().getFullYear());
  const [pesquisa, setPesquisa] = useState("");

  // Estados de edição
  const [editandoId, setEditandoId] = useState(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (!nome || nome.trim().length < 2) {
      error("Por favor, insira um nome válido para a turma.");
      return false;
    }
    if (!cursoId) {
      error("Por favor, selecione um curso.");
      return false;
    }
    if (!turno) {
      error("Por favor, selecione um turno.");
      return false;
    }
    if (semestreInicio !== 1 && semestreInicio !== 2) {
      error("Por favor, selecione um semestre válido (1º ou 2º).");
      return false;
    }
    if (!anoInicio || anoInicio < 2000 || anoInicio > new Date().getFullYear() + 5) {
      error("Por favor, insira um ano de início válido.");
      return false;
    }
    return true;
  }

  // Preenche o formulário com os dados da turma e entra em modo edição
  function iniciarEdicao(turma) {
    setEditandoId(turma.id);
    setNome(turma.nome);
    setCursoId(turma.curso_id);
    setTurno(turma.turno);
    setSemestreInicio(turma.semestre_inicio);
    setAnoInicio(turma.ano_inicio);
    // Scroll suave pro topo do formulário
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvarEdicao() {
    if (!validarEntrada()) return;

    const turmaAtualizada = {
      nome: nome.trim(),
      cursoId: Number(cursoId),
      semestreInicio: Number(semestreInicio),
      anoInicio: Number(anoInicio),
      turno,
    };

    try {
      const response = await fetch(`${API_BASE}/turmas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turmaAtualizada),
      });

      if (!response.ok) throw new Error(await response.text());

      const turmaEditada = await response.json();

      // Substitui a turma antiga pela editada no estado
      setTurmas((prev) =>
        prev.map((t) => (t.id === editandoId ? turmaEditada : t)),
      );

      setEditandoId(null);
      limparFormulario();
      success("Turma atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao editar turma:", err);
      error("Não foi possível editar a turma: " + err.message);
    }
  }

  async function adicionarTurma() {
    if (!validarEntrada()) return;

    // Se está editando, salva a edição em vez de adicionar
    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novaTurma = {
      nome: nome.trim(),
      cursoId: Number(cursoId),
      semestreInicio: Number(semestreInicio),
      anoInicio: Number(anoInicio),
      turno,
    };

    try {
      const response = await fetch(`${API_BASE}/turmas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTurma),
      });

      if (!response.ok) throw new Error(await response.text());

      const turmaCriada = await response.json();
      setTurmas((prev) => [...prev, turmaCriada]);
      limparFormulario();
      success("Turma adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar turma:", err.message);
      error("Erro ao adicionar turma: " + err.message);
    }
  }

  async function removerTurma(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(`${API_BASE}/turmas/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setTurmas((prev) => prev.filter((t) => t.id !== id));
          success("Turma removida com sucesso!");
        } catch (err) {
          console.error("Erro ao remover turma:", err.message);
          error("Não foi possível remover a turma: " + err.message);
        }
      },
      null,
      "Excluir turma?"
    );
  }

  function limparFormulario() {
    setNome("");
    setCursoId("");
    setTurno("");
    setSemestreInicio(1);
    setAnoInicio(new Date().getFullYear());
  }

  function nomeCurso(id) {
    const curso = cursos.find((c) => c.id === id);
    return curso ? curso.nome : "—";
  }

  const turmasFiltradas = turmas.filter((turma) =>
    turma.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    nomeCurso(turma.curso_id).toLowerCase().includes(pesquisa.toLowerCase()) ||
    turma.turno.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal modal-turmas">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar turma" : "Gerenciar turmas"}</h2>
            <span className="modal-badge">{turmas.length} cadastradas</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Banner de modo edição */}
          {editandoId && (
            <div className="edit-banner">
              <span>Editando turma — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}

          {/* Formulário */}
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome da turma</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Turma A"
              />
            </div>

            <div className="form-group full">
              <label>Curso</label>
              <select
                value={cursoId}
                onChange={(e) => setCursoId(e.target.value)}
              >
                <option value="">Selecione o curso</option>
                {cursos.map((curso) => (
                  <option key={curso.id} value={curso.id}>
                    {curso.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Turno</label>
              <select value={turno} onChange={(e) => setTurno(e.target.value)}>
                <option value="">Selecione o turno</option>
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>

            <div className="form-group">
              <label>Semestre de início</label>
              <select
                value={semestreInicio}
                onChange={(e) => setSemestreInicio(Number(e.target.value))}
              >
                <option value={1}>1º semestre</option>
                <option value={2}>2º semestre</option>
              </select>
            </div>

            <div className="form-group full">
              <label>Ano de início</label>
              <input
                type="number"
                value={anoInicio}
                onChange={(e) => setAnoInicio(Number(e.target.value))}
                min="2000"
                max={new Date().getFullYear() + 5}
              />
            </div>
          </div>

          {/* Botão muda conforme o modo */}
          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarTurma}>
              + Adicionar turma
            </button>
          )}

          <div className="modal-divider" />

          {/* Barra de pesquisa */}
          {turmas.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar turmas..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* Lista */}
          {turmas.length === 0 ? (
            <p className="lista-feedback">Nenhuma turma cadastrada.</p>
          ) : turmasFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma turma encontrada.</p>
          ) : (
            <ul className="lista-turmas">
              {turmasFiltradas.map((turma) => (
                <li
                  key={turma.id}
                  className={`item-turma ${editandoId === turma.id ? "item-editando" : ""}`}
                >
                  <div className="item-info">
                    <span className="item-nome">{turma.nome}</span>
                    <div className="item-meta">
                      <span className="pill curso">
                        {nomeCurso(turma.curso_id)}
                      </span>
                      <span className="pill turno">{turma.turno}</span>
                      <span className="pill periodo">
                        {turma.ano_inicio}.{turma.semestre_inicio}
                      </span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn-edit"
                      onClick={() => iniciarEdicao(turma)}
                    >
                      Editar
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => removerTurma(turma.id)}
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