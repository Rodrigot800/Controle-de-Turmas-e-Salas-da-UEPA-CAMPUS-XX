import { useState, useRef } from "react";
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
  const [cursosExpandidos, setCursosExpandidos] = useState({});

  const modalRef = useRef(null);
  const nomeInputRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (!nome || nome.trim().length < 2) {
      error("Por favor, insira um nome válido para the turma.");
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

  function normalizarTurnoCapitalizado(turno) {
    if (!turno) return "";
    const t = turno.toLowerCase();
    if (t.includes("manh") || t.includes("manhã")) return "Manhã";
    if (t.includes("tard")) return "Tarde";
    if (t.includes("noit")) return "Noite";
    return turno.charAt(0).toUpperCase() + turno.slice(1).toLowerCase();
  }

  // Preenche o formulário com os dados da turma e entra em modo edição
  function iniciarEdicao(turma) {
    setEditandoId(turma.id);
    setNome(turma.nome);
    setCursoId(turma.curso_id);
    setTurno(normalizarTurnoCapitalizado(turma.turno));
    setSemestreInicio(turma.semestre_inicio);
    setAnoInicio(turma.ano_inicio);
    
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

  function toggleCurso(id) {
    setCursosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
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
      error("Não foi possível editar the turma: " + err.message);
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
          error("Não foi possível remover the turma: " + err.message);
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

  // Agrupamento de turmas por curso
  const groupedData = {};
  groupedData["sem-curso"] = { nome: "Sem curso vinculado", turmas: [] };
  cursos.forEach(c => {
    groupedData[c.id] = { nome: c.nome, turmas: [] };
  });

  turmasFiltradas.forEach(t => {
    if (groupedData[t.curso_id]) {
      groupedData[t.curso_id].turmas.push(t);
    } else {
      groupedData["sem-curso"].turmas.push(t);
    }
  });

  return (
    <div className="modal-backdrop">
      <div className="modal modal-turmas" ref={modalRef}>
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
                ref={nomeInputRef}
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
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
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
            <div className="accordion-container" style={{ marginTop: '16px' }}>
              {Object.keys(groupedData).map(cId => {
                const cursoData = groupedData[cId];
                const turmasDoCurso = cursoData.turmas;

                if (turmasDoCurso.length === 0) return null;

                const isCursoExpanded = cursosExpandidos[cId];

                return (
                  <div key={cId} className="accordion-curso">
                    <div 
                      onClick={() => toggleCurso(cId)}
                      style={{ padding: '12px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 'bold', borderRadius: '6px', marginBottom: isCursoExpanded ? '0' : '8px', borderBottomLeftRadius: isCursoExpanded ? '0' : '6px', borderBottomRightRadius: isCursoExpanded ? '0' : '6px' }}
                    >
                      <span style={{color: '#111', fontSize: '14px'}}>{cursoData.nome}</span>
                      <span style={{color: '#9ca3af'}}>{isCursoExpanded ? "▼" : "▶"}</span>
                    </div>

                    {isCursoExpanded && (
                      <ul style={{ padding: 0, margin: 0, listStyle: 'none', width: '100%', border: '1px solid #e5e7eb', borderTop: 'none', borderRadius: '0 0 6px 6px', marginBottom: '8px' }}>
                        {turmasDoCurso.map((turma) => (
                          <li
                            key={turma.id}
                            className={`item-curso ${editandoId === turma.id ? "item-editando" : ""}`}
                            style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                          >
                            <div className="item-info">
                              <span className="item-nome">{turma.nome}</span>
                              <div className="item-meta" style={{ marginTop: '4px' }}>
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
                                style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}
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
                );
              })}
            </div>
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