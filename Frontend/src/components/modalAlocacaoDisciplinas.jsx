import { useState, useRef } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalAlocacaoDisciplinas({ 
  alocacoesDisciplinas, setAlocacoesDisciplinas, 
  turmas, disciplinas, professores, salas, onClose 
}) {
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [diaSemana, setDiaSemana] = useState("Segunda-feira");
  const [isModular, setIsModular] = useState(false);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [pesquisa, setPesquisa] = useState("");
  const [editandoId, setEditandoId] = useState(null);

  const modalRef = useRef(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  const diasSemanaOptions = [
    "Segunda-feira", "Terça-feira", "Quarta-feira", 
    "Quinta-feira", "Sexta-feira", "Sábado", "Domingo"
  ];

  function validarEntrada() {
    if (!turmaId || !disciplinaId || !salaId || !diaSemana) {
      error("Turma, Disciplina, Sala e Dia da Semana são obrigatórios.");
      return false;
    }
    return true;
  }

  function formatarDataParaInput(dataIso) {
    if (!dataIso) return "";
    return dataIso.split("T")[0];
  }

  function iniciarEdicao(alocacao) {
    setEditandoId(alocacao.id);
    setTurmaId(alocacao.turma_id);
    setDisciplinaId(alocacao.disciplina_id);
    setProfessorId(alocacao.professor_id || "");
    setSalaId(alocacao.sala_id);
    setDiaSemana(alocacao.dia_semana);
    setIsModular(alocacao.is_modular);
    setDataInicio(formatarDataParaInput(alocacao.data_inicio));
    setDataFim(formatarDataParaInput(alocacao.data_fim));
    
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

    const alocacaoAtualizada = {
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      professor_id: professorId ? Number(professorId) : null,
      sala_id: Number(salaId),
      dia_semana: diaSemana,
      is_modular: isModular,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
    };

    try {
      const response = await fetch(`${API_BASE}/alocacoes-disciplinas/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alocacaoAtualizada),
      });

      if (!response.ok) throw new Error(await response.text());

      const alocacaoEditada = await response.json();
      
      // Enriquecer objeto para a lista
      alocacaoEditada.turma_nome = turmas.find(t => t.id === alocacaoEditada.turma_id)?.nome;
      alocacaoEditada.disciplina_nome = disciplinas.find(d => d.id === alocacaoEditada.disciplina_id)?.nome;
      alocacaoEditada.professor_nome = professores.find(p => p.id === alocacaoEditada.professor_id)?.nome;
      alocacaoEditada.sala_nome = salas.find(s => s.id === alocacaoEditada.sala_id)?.nome;

      setAlocacoesDisciplinas((prev) =>
        prev.map((a) => (a.id === editandoId ? alocacaoEditada : a))
      );

      setEditandoId(null);
      limparFormulario();
      success("Alocação atualizada com sucesso!");
    } catch (err) {
      console.error("Erro ao editar alocação:", err);
      error("Não foi possível editar a alocação: " + err.message);
    }
  }

  async function adicionarAlocacao() {
    if (!validarEntrada()) return;

    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novaAlocacao = {
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      professor_id: professorId ? Number(professorId) : null,
      sala_id: Number(salaId),
      dia_semana: diaSemana,
      is_modular: isModular,
      data_inicio: dataInicio || null,
      data_fim: dataFim || null,
    };

    try {
      const response = await fetch(`${API_BASE}/alocacoes-disciplinas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaAlocacao),
      });

      if (!response.ok) {
        const erro = await response.json();
        throw new Error(erro.erro || "Erro ao adicionar alocação");
      }

      const alocacaoCriada = await response.json();
      
      // Enriquecer objeto para a lista
      alocacaoCriada.turma_nome = turmas.find(t => t.id === alocacaoCriada.turma_id)?.nome;
      alocacaoCriada.disciplina_nome = disciplinas.find(d => d.id === alocacaoCriada.disciplina_id)?.nome;
      alocacaoCriada.professor_nome = professores.find(p => p.id === alocacaoCriada.professor_id)?.nome;
      alocacaoCriada.sala_nome = salas.find(s => s.id === alocacaoCriada.sala_id)?.nome;

      setAlocacoesDisciplinas((prev) => [...prev, alocacaoCriada]);
      limparFormulario();
      success("Alocação adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar alocação:", err.message);
      error("Erro ao adicionar alocação: " + err.message);
    }
  }

  async function removerAlocacao(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        try {
          const response = await fetch(`${API_BASE}/alocacoes-disciplinas/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setAlocacoesDisciplinas((prev) => prev.filter((a) => a.id !== id));
          success("Alocação removida com sucesso!");
        } catch (err) {
          console.error("Erro ao remover alocação:", err.message);
          error("Não foi possível remover a alocação.");
        }
      },
      null,
      "Excluir alocação?"
    );
  }

  function limparFormulario() {
    setTurmaId("");
    setDisciplinaId("");
    setProfessorId("");
    setSalaId("");
    setDiaSemana("Segunda-feira");
    setIsModular(false);
    setDataInicio("");
    setDataFim("");
  }

  const alocacoesFiltradas = alocacoesDisciplinas.filter((a) =>
    a.turma_nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    a.disciplina_nome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
    a.sala_nome?.toLowerCase().includes(pesquisa.toLowerCase())
  );

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef} style={{ maxWidth: '800px' }}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar Alocação de Disciplina" : "Alocar Disciplina"}</h2>
            <span className="modal-badge">{alocacoesDisciplinas.length} alocações</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando alocação — altere os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}
          
          <div className="form-grid">
            <div className="form-group">
              <label>Turma</label>
              <select value={turmaId} onChange={(e) => setTurmaId(e.target.value)}>
                <option value="">Selecione uma turma</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>{t.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Disciplina</label>
              <select value={disciplinaId} onChange={(e) => setDisciplinaId(e.target.value)}>
                <option value="">Selecione uma disciplina</option>
                {disciplinas.map(d => (
                  <option key={d.id} value={d.id}>{d.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Professor (Opcional)</label>
              <select value={professorId} onChange={(e) => setProfessorId(e.target.value)}>
                <option value="">Sem professor definido</option>
                {professores.map(p => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Sala</label>
              <select value={salaId} onChange={(e) => setSalaId(e.target.value)}>
                <option value="">Selecione uma sala</option>
                {salas.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Dia da Semana</label>
              <select value={diaSemana} onChange={(e) => setDiaSemana(e.target.value)}>
                {diasSemanaOptions.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
              <input 
                type="checkbox" 
                id="isModular" 
                checked={isModular} 
                onChange={(e) => setIsModular(e.target.checked)} 
                style={{ width: 'auto' }}
              />
              <label htmlFor="isModular" style={{ margin: 0 }}>Disciplina Modular?</label>
            </div>

            <div className="form-group">
              <label>Data Início (Opcional)</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Data Fim (Opcional)</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} />
            </div>
          </div>

          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarAlocacao}>
              + Adicionar alocação
            </button>
          )}

          <div className="modal-divider" />

          {alocacoesDisciplinas.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar por turma, disciplina ou sala..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {alocacoesDisciplinas.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação cadastrada.</p>
          ) : alocacoesFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação encontrada.</p>
          ) : (
            <ul className="lista-cursos">
              {alocacoesFiltradas.map((a) => (
                <li
                  key={a.id}
                  className={`item-curso ${editandoId === a.id ? "item-editando" : ""}`}
                >
                  <div className="item-info">
                    <span className="item-nome">
                      {a.turma_nome} - {a.disciplina_nome}
                    </span>
                    <div className="item-meta">
                      <span className="pill">{a.sala_nome}</span>
                      <span className="pill">{a.dia_semana}</span>
                      {a.is_modular && <span className="pill" style={{backgroundColor: '#e3f2fd', color: '#1565c0'}}>Modular</span>}
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => iniciarEdicao(a)}>Editar</button>
                    <button className="btn-delete" onClick={() => removerAlocacao(a.id)}>Excluir</button>
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
