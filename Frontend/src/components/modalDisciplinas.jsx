import { useState, useRef } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalDisciplinas({ disciplinas, setDisciplinas, cursos, cursoDisciplinas, setCursoDisciplinas, onClose }) {
  const [nome, setNome] = useState("");
  const [duracao, setDuracao] = useState(60);
  const [cursoId, setCursoId] = useState("");
  const [semestre, setSemestre] = useState(1);
  const [pesquisa, setPesquisa] = useState("");

  const [cursosExpandidos, setCursosExpandidos] = useState({});
  const [semestresExpandidos, setSemestresExpandidos] = useState({});

  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);
  const nomeInputRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para a disciplina.");
      return false;
    }
    if (duracao <= 0 || isNaN(duracao)) {
      error("Por favor, insira uma duração válida.");
      return false;
    }
    if (!cursoId) {
      error("Por favor, selecione um curso para a disciplina.");
      return false;
    }
    if (semestre <= 0 || isNaN(semestre)) {
      error("Por favor, insira um semestre válido.");
      return false;
    }
    return true;
  }

  function toggleCurso(id) {
    setCursosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleSemestre(cursoId, sem) {
    const key = `${cursoId}-${sem}`;
    setSemestresExpandidos(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function iniciarEdicao(disciplina) {
    setEditandoId(disciplina.id);
    setNome(disciplina.nome);
    setDuracao(disciplina.duracao || 60);
    const alocacao = cursoDisciplinas.find(cd => Number(cd.disciplina_id) === Number(disciplina.id));
    setCursoId(alocacao ? String(alocacao.curso_id) : "");
    setSemestre(alocacao ? (Number(alocacao.semestre_disciplina) || 1) : 1);
    
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

    const disciplinaAtualizada = {
      nome: nome.trim(),
      duracao: Number(duracao),
    };

    try {
      const response = await fetch(`${API_BASE}/disciplinas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(disciplinaAtualizada),
      });

      if (!response.ok) throw new Error(await response.text());

      const disciplinaEditada = await response.json();

      // Substitui a disciplina
      setDisciplinas((prev) =>
        prev.map((d) => (d.id === editandoId ? disciplinaEditada : d)),
      );

      // Agora atualiza a alocação (se mudou o curso ou o semestre)
      const alocacaoAntiga = cursoDisciplinas.find(cd => Number(cd.disciplina_id) === Number(editandoId));
      
      if (alocacaoAntiga) {
        if (Number(alocacaoAntiga.curso_id) !== Number(cursoId) || Number(alocacaoAntiga.semestre_disciplina) !== Number(semestre)) {
          // Deleta a alocação antiga
          await fetch(`${API_BASE}/curso-disciplinas/${alocacaoAntiga.id}`, { method: "DELETE" });
          // Cria nova
          const resAloc = await fetch(`${API_BASE}/curso-disciplinas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ curso_id: Number(cursoId), disciplina_id: editandoId, semestre_disciplina: Number(semestre) }),
          });
          const novaAloc = await resAloc.json();
          setCursoDisciplinas((prev) => prev.map((cd) => (cd.id === alocacaoAntiga.id ? novaAloc : cd)));
        }
      } else {
        // Se por algum motivo não tinha, cria
        const resAloc = await fetch(`${API_BASE}/curso-disciplinas`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ curso_id: Number(cursoId), disciplina_id: editandoId, semestre_disciplina: Number(semestre) }),
        });
        const novaAloc = await resAloc.json();
        setCursoDisciplinas((prev) => [...prev, novaAloc]);
      }

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
      duracao: Number(duracao),
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

      // Após criar a disciplina, aloca ela ao curso
      const responseAlocacao = await fetch(`${API_BASE}/curso-disciplinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: Number(cursoId),
          disciplina_id: disciplinaCriada.id,
          semestre_disciplina: Number(semestre)
        }),
      });

      if (responseAlocacao.ok) {
        const alocacaoCriada = await responseAlocacao.json();
        setCursoDisciplinas((prev) => [...prev, alocacaoCriada]);
      } else {
        error("Disciplina criada, mas erro ao vincular curso. Verifique manualmente.");
      }

      limparFormulario();
      success("Disciplina adicionada e vinculada ao curso com sucesso!");
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
          // Remove a alocação do estado local (no banco o ON DELETE CASCADE já removeu)
          setCursoDisciplinas((prev) => prev.filter((cd) => cd.disciplina_id !== id));
          success("Disciplina removida com sucesso!");
        } catch (err) {
          console.error("Erro ao remover disciplina:", err.message);
          error("Não foi possível remover a disciplina: " + err.message);
        }
      },
      null,
      "Excluir disciplina?"
    );
  }

  function limparFormulario() {
    setNome("");
    setDuracao(60);
    setCursoId("");
    setSemestre(1);
  }

  function getNomeCurso(disciplinaId) {
    const alocacao = cursoDisciplinas.find(cd => Number(cd.disciplina_id) === Number(disciplinaId));
    if (!alocacao) return "Sem curso vinculado";
    const curso = cursos.find(c => c.id === alocacao.curso_id);
    return curso ? curso.nome : "Curso desconhecido";
  }

  function getSemestre(disciplinaId) {
    const alocacao = cursoDisciplinas.find(cd => Number(cd.disciplina_id) === Number(disciplinaId));
    return alocacao ? alocacao.semestre_disciplina : null;
  }

  const disciplinasFiltradas = disciplinas.filter((disciplina) => {
    const nomeD = disciplina.nome.toLowerCase();
    const nomeC = getNomeCurso(disciplina.id).toLowerCase();
    const termo = pesquisa.toLowerCase();
    return nomeD.includes(termo) || nomeC.includes(termo);
  });

  const groupedData = {};
  groupedData["sem-curso"] = { nome: "Sem curso vinculado", semestres: { "null": [] } };
  cursos.forEach(c => { groupedData[c.id] = { nome: c.nome, semestres: {} }; });

  disciplinasFiltradas.forEach(d => {
    const alocacao = cursoDisciplinas.find(cd => Number(cd.disciplina_id) === Number(d.id));
    let cId = "sem-curso";
    let sem = "null";

    if (alocacao) {
      if (groupedData[alocacao.curso_id]) cId = alocacao.curso_id;
      sem = String(alocacao.semestre_disciplina || "null");
    }

    if (!groupedData[cId].semestres[sem]) groupedData[cId].semestres[sem] = [];
    groupedData[cId].semestres[sem].push(d);
  });

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar disciplina" : "Gerenciar disciplinas"}</h2>
            <span className="modal-badge">{disciplinas.length} cadastradas</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando disciplina — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>Cancelar</button>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group full">
              <label>Nome da Disciplina</label>
              <input
                ref={nomeInputRef}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Cálculo I"
              />
            </div>

            <div className="form-group full">
              <label>Duração (h)</label>
              <input
                type="number"
                value={duracao}
                onChange={(e) => setDuracao(Number(e.target.value))}
                min="1"
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

            <div className="form-group full">
              <label>Semestre da Disciplina</label>
              <input
                type="number"
                value={semestre}
                onChange={(e) => setSemestre(Number(e.target.value))}
                min="1"
                placeholder="Ex: 1 para 1º Semestre"
              />
            </div>
          </div>

          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>Salvar alterações</button>
          ) : (
            <button className="btn-primary" onClick={adicionarDisciplina}>+ Adicionar disciplina</button>
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
            <div className="accordion-container" style={{ marginTop: '16px' }}>
              {Object.keys(groupedData).map(cId => {
                const cursoData = groupedData[cId];
                const semestresKeys = Object.keys(cursoData.semestres);
                const hasDisciplinas = semestresKeys.some(s => cursoData.semestres[s].length > 0);
                
                if (!hasDisciplinas) return null;

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
                      <div className="accordion-body" style={{ padding: '12px 0 12px 16px', borderLeft: '2px solid #e5e7eb', borderRight: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginBottom: '8px', borderBottomLeftRadius: '6px', borderBottomRightRadius: '6px' }}>
                        {semestresKeys.sort((a,b) => Number(a) - Number(b)).map(sem => {
                          const disciplinasDoSemestre = cursoData.semestres[sem];
                          if (disciplinasDoSemestre.length === 0) return null;

                          const semKey = `${cId}-${sem}`;
                          const isSemExpanded = semestresExpandidos[semKey];

                          return (
                            <div key={semKey} className="accordion-semestre" style={{ marginBottom: '8px', paddingRight: '16px' }}>
                              <div 
                                onClick={() => toggleSemestre(cId, sem)}
                                style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1d4ed8', fontWeight: '500', marginBottom: isSemExpanded ? '4px' : '0', fontSize: '13px' }}
                              >
                                <span>{sem === "null" ? "Sem Semestre Definido" : `${sem}º Semestre`}</span>
                                <span>{isSemExpanded ? "▼" : "▶"}</span>
                              </div>

                              {isSemExpanded && (
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none', width: '100%', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                  {disciplinasDoSemestre.map((disciplina) => (
                                    <li key={disciplina.id} className="item-curso" style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div className="item-info">
                                        <span className="item-nome">{disciplina.nome}</span>
                                        <div className="item-meta">
                                          <span className="pill">{disciplina.duracao}h</span>
                                        </div>
                                      </div>
                                      <div className="item-actions">
                                        <button className="btn-edit" onClick={() => iniciarEdicao(disciplina)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}>Editar</button>
                                        <button className="btn-delete" onClick={() => removerDisciplina(disciplina.id)}>Excluir</button>
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
