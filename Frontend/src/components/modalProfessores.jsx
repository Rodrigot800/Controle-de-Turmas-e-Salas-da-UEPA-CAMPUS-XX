import { useState, useRef, useEffect } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalProfessores({ professores, setProfessores, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursosIds, setCursosIds] = useState([]);
  const [cursoDropdownOpen, setCursoDropdownOpen] = useState(false);
  const [pesquisa, setPesquisa] = useState("");

  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);
  const nomeInputRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setCursoDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      error("Por favor, insira um nome válido para o professor.");
      return false;
    }
    if (cursosIds.length === 0) {
      error("Por favor, selecione pelo menos um curso.");
      return false;
    }
    return true;
  }

  function iniciarEdicao(professor) {
    setEditandoId(professor.id);
    setNome(professor.nome);
    setCursosIds(professor.cursos_ids || []);
    
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

    const professorAtualizado = {
      nome: nome.trim(),
      cursos_ids: cursosIds.map(Number),
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
      cursos_ids: cursosIds.map(Number),
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
    setCursosIds([]);
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
      <div className="modal" ref={modalRef}>
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
                ref={nomeInputRef}
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: João da Silva"
              />
            </div>

            <div className="form-group full">
              <label>Cursos Ministrados</label>
              <div 
                ref={dropdownRef}
                className="multi-select-container" 
                style={{ position: 'relative', marginTop: '5px' }}
              >
                <div 
                  className="multi-select-box" 
                  onClick={() => setCursoDropdownOpen(!cursoDropdownOpen)}
                  style={{
                    border: '1px solid #d1d5db', padding: '8px', borderRadius: '6px', minHeight: '40px',
                    display: 'flex', flexWrap: 'wrap', gap: '6px', cursor: 'pointer', background: '#f9fafb',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {cursosIds.length === 0 ? (
                    <span style={{ color: '#6b7280', padding: '2px 4px', fontSize: '14px' }}>Selecione os cursos...</span>
                  ) : (
                    cursosIds.map(cid => {
                      const c = cursos.find(x => x.id === Number(cid));
                      if (!c) return null;
                      return (
                        <span key={cid} style={{
                          background: '#e0e7ff', color: '#3730a3', padding: '4px 10px', borderRadius: '14px',
                          fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px',
                          border: '1px solid #c7d2fe', fontWeight: '500'
                        }}>
                          {c.nome}
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCursosIds(prev => prev.filter(id => Number(id) !== Number(cid)));
                            }}
                            style={{ 
                              background: 'transparent', border: 'none', color: '#4f46e5', cursor: 'pointer', 
                              padding: 0, fontSize: '16px', lineHeight: 1, display: 'flex', alignItems: 'center' 
                            }}
                          >×</button>
                        </span>
                      );
                    })
                  )}
                </div>

                {cursoDropdownOpen && (
                  <div className="multi-select-dropdown" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', 
                    border: '1px solid #e5e7eb', borderRadius: '6px', marginTop: '6px', 
                    maxHeight: '200px', overflowY: 'auto', zIndex: 50, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}>
                    {cursos.map(c => {
                      const isSelected = cursosIds.includes(Number(c.id)) || cursosIds.includes(String(c.id));
                      return (
                        <div 
                          key={c.id} 
                          onClick={() => {
                            if (isSelected) {
                              setCursosIds(prev => prev.filter(id => Number(id) !== Number(c.id)));
                            } else {
                              setCursosIds(prev => [...prev, Number(c.id)]);
                            }
                          }}
                          style={{
                            padding: '10px 14px', cursor: 'pointer', 
                            background: isSelected ? '#f3f4f6' : 'transparent',
                            display: 'flex', alignItems: 'center', gap: '10px',
                            borderBottom: '1px solid #f3f4f6', transition: 'background 0.1s'
                          }}
                          onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.background = '#f9fafb' }}
                          onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.background = 'transparent' }}
                        >
                          <input type="checkbox" checked={isSelected} readOnly style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: '#4f46e5' }} />
                          <span style={{ fontWeight: isSelected ? '600' : '400', color: isSelected ? '#111827' : '#374151', fontSize: '14px' }}>{c.nome}</span>
                        </div>
                      );
                    })}
                    {cursos.length === 0 && <div style={{ padding: '10px 14px', color: '#6b7280', fontSize: '14px' }}>Nenhum curso disponível</div>}
                  </div>
                )}
              </div>
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
                      {(professor.cursos_ids || []).map(cid => (
                        <span key={cid} className="pill" style={{ marginRight: '4px', marginBottom: '4px', display: 'inline-block' }}>
                          {getNomeCurso(cid)}
                        </span>
                      ))}
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
