import { useState } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalAlocacaoPeriodo({ 
  salas, 
  turmas, 
  professores, 
  disciplinas,
  cursoDisciplinas,
  alocacoesDisciplinas, 
  setAlocacoesDisciplinas, 
  onClose 
}) {
  const [salaId, setSalaId] = useState("");
  const [turmaId, setTurmaId] = useState("");
  const [disciplinaId, setDisciplinaId] = useState("");
  const [professorId, setProfessorId] = useState("");
  const [turno, setTurno] = useState("");
  const [tipoDisciplina, setTipoDisciplina] = useState("MODULAR");
  const [diaSemana, setDiaSemana] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [pesquisa, setPesquisa] = useState("");

  // ── Derivados p/ filtros inteligentes ──────────────────
  // Curso da turma selecionada
  const turmaSelecionada = turmas.find(t => String(t.id) === String(turmaId));
  const cursoIdDaTurma = turmaSelecionada?.curso_id ?? null;

  // IDs de disciplinas do curso selecionado
  const disciplinasDosCursoIds = cursoIdDaTurma
    ? cursoDisciplinas.filter(cd => cd.curso_id === cursoIdDaTurma).map(cd => cd.disciplina_id)
    : null;

  // Lista de disciplinas filtrada pelo curso (ou todas, se nenhuma turma selecionada)
  const disciplinasFiltradas = disciplinasDosCursoIds
    ? disciplinas.filter(d => disciplinasDosCursoIds.includes(d.id))
    : disciplinas;

  // Professores filtrados pelo curso (e opcionalmente pela disciplina via curso)
  const professoresFiltrados = cursoIdDaTurma
    ? professores.filter(p => p.curso_id === cursoIdDaTurma)
    : professores;


  const { alert, showAlert, showConfirm, error, success } = useAlert();

  const DIAS_SEMANA = [
    { id: 1, nome: "Segunda-feira" },
    { id: 2, nome: "Terça-feira" },
    { id: 3, nome: "Quarta-feira" },
    { id: 4, nome: "Quinta-feira" },
    { id: 5, nome: "Sexta-feira" },
    { id: 6, nome: "Sábado" },
    { id: 0, nome: "Domingo" }
  ];

  function validarEntrada() {
    if (!salaId) { error("Selecione uma sala."); return false; }
    if (!turmaId) { error("Selecione uma turma."); return false; }
    if (!disciplinaId) { error("Selecione uma disciplina."); return false; }
    if (!tipoDisciplina) { error("Selecione o tipo de disciplina."); return false; }
    
    if (tipoDisciplina === "SEMANAL" && !diaSemana && diaSemana !== 0) {
      error("Selecione o dia da semana para disciplina semanal.");
      return false;
    }
    
    return true;
  }

  function formatarDataEnvio(data) {
    if (!data) return null;
    return data;
  }

  function handleTurmaChange(novoTurmaId) {
    setTurmaId(novoTurmaId);
    setDisciplinaId("");
    setProfessorId("");
    // Preencher turno automaticamente da turma
    const turma = turmas.find(t => String(t.id) === String(novoTurmaId));
    if (turma?.turno) setTurno(turma.turno);
    else setTurno("");
  }

  function handleDisciplinaChange(novaDiscId) {
    setDisciplinaId(novaDiscId);
    setProfessorId("");
  }

  function iniciarEdicao(aloc) {
    setEditandoId(aloc.id);
    setSalaId(aloc.sala_id || "");
    setTurmaId(aloc.turma_id || "");
    setDisciplinaId(aloc.disciplina_id || "");
    setProfessorId(aloc.professor_id || "");
    setTurno(aloc.turno || "");
    setTipoDisciplina(aloc.tipo_disciplina || "MODULAR");
    setDiaSemana(aloc.dia_semana ?? "");
    
    setDataInicio(aloc.data_inicio ? aloc.data_inicio.split('T')[0] : "");
    setDataFim(aloc.data_fim ? aloc.data_fim.split('T')[0] : "");
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvar() {
    if (!validarEntrada()) return;

    const payload = {
      sala_id: Number(salaId),
      turma_id: Number(turmaId),
      disciplina_id: Number(disciplinaId),
      professor_id: professorId ? Number(professorId) : null,
      turno: turno || null,
      tipo_disciplina: tipoDisciplina,
      dia_semana: tipoDisciplina === "SEMANAL" ? Number(diaSemana) : null,
      data_inicio: formatarDataEnvio(dataInicio),
      data_fim: formatarDataEnvio(dataFim)
    };

    try {
      const url = editandoId 
        ? `${API_BASE}/alocacoes-disciplinas/${editandoId}` 
        : `${API_BASE}/alocacoes-disciplinas`;
      
      const method = editandoId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(await response.text());

      const alocacaoSalva = await response.json();

      // Recarregar tudo para ter os nomes dos joins, ou simular localmente
      const turma = turmas.find(t => t.id === Number(turmaId));
      const disc = disciplinas.find(d => d.id === Number(disciplinaId));
      const prof = professores.find(p => p.id === Number(professorId));
      const sala = salas.find(s => s.id === Number(salaId));

      const alocacaoCompleta = {
        ...alocacaoSalva,
        turma_nome: turma?.nome,
        ano_inicio: turma?.ano_inicio ?? null,
        disciplina_nome: disc?.nome,
        professor_nome: prof?.nome,
        sala_nome: sala?.nome
      };

      if (editandoId) {
        setAlocacoesDisciplinas(prev => prev.map(a => a.id === editandoId ? alocacaoCompleta : a));
        success("Alocação atualizada com sucesso!");
      } else {
        setAlocacoesDisciplinas(prev => [...prev, alocacaoCompleta]);
        success("Alocação cadastrada com sucesso!");
      }

      setEditandoId(null);
      limparFormulario();
    } catch (err) {
      console.error("Erro ao salvar alocação:", err);
      error("Não foi possível salvar a alocação: " + err.message);
    }
  }

  async function remover(id) {
    showConfirm("Esta ação não pode ser desfeita.", async () => {
      try {
        const response = await fetch(`${API_BASE}/alocacoes-disciplinas/${id}`, {
          method: "DELETE",
        });

        if (!response.ok) throw new Error(await response.text());

        setAlocacoesDisciplinas(prev => prev.filter(a => a.id !== id));
        success("Alocação removida com sucesso!");
      } catch (err) {
        console.error("Erro ao remover:", err);
        error("Não foi possível remover: " + err.message);
      }
    }, null, "Excluir Alocação?");
  }

  function limparFormulario() {
    setSalaId("");
    setTurmaId("");
    setDisciplinaId("");
    setProfessorId("");
    setTurno("");
    setTipoDisciplina("MODULAR");
    setDiaSemana("");
    setDataInicio("");
    setDataFim("");
  }

  const alocacoesFiltradas = alocacoesDisciplinas.filter(aloc => {
    const termo = pesquisa.toLowerCase();
    const txtSala = aloc.sala_nome?.toLowerCase() || "";
    const txtTurma = aloc.turma_nome?.toLowerCase() || "";
    const txtDisc = aloc.disciplina_nome?.toLowerCase() || "";
    const txtProf = aloc.professor_nome?.toLowerCase() || "";
    
    return txtSala.includes(termo) || txtTurma.includes(termo) || txtDisc.includes(termo) || txtProf.includes(termo);
  });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar Alocação de Período" : "Nova Alocação de Período"}</h2>
            <span className="modal-badge">{alocacoesDisciplinas.length} alocações</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando alocação da grade curricular.</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>Cancelar</button>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Sala *</label>
              <select value={salaId} onChange={e => setSalaId(e.target.value)}>
                <option value="">Selecione a Sala</option>
                {salas.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Turma *</label>
              <select value={turmaId} onChange={e => handleTurmaChange(e.target.value)}>
                <option value="">Selecione a Turma</option>
                {turmas.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.nome} {t.ano_inicio} {t.turno ? `• ${t.turno}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label>Disciplina *</label>
              <select value={disciplinaId} onChange={e => handleDisciplinaChange(e.target.value)} disabled={!turmaId}>
                <option value="">{turmaId ? "Selecione a Disciplina" : "Selecione uma turma primeiro"}</option>
                {disciplinasFiltradas.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
              </select>
            </div>

            <div className="form-group full">
              <label>Professor (Opcional)</label>
              <select value={professorId} onChange={e => setProfessorId(e.target.value)} disabled={!turmaId}>
                <option value="">{turmaId ? "A Definir" : "Selecione uma turma primeiro"}</option>
                {professoresFiltrados.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
            </div>

            <div className="form-group full" style={{ flexDirection: 'row', gap: '20px', alignItems: 'center', marginTop: '10px', marginBottom: '10px' }}>
              <label style={{ marginRight: '10px' }}>Tipo:</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', textTransform: 'none' }}>
                <input 
                  type="radio" 
                  name="tipoDisciplina" 
                  value="MODULAR" 
                  checked={tipoDisciplina === "MODULAR"}
                  onChange={() => setTipoDisciplina("MODULAR")}
                />
                Modular
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'normal', textTransform: 'none' }}>
                <input 
                  type="radio" 
                  name="tipoDisciplina" 
                  value="SEMANAL" 
                  checked={tipoDisciplina === "SEMANAL"}
                  onChange={() => setTipoDisciplina("SEMANAL")}
                />
                Semanal
              </label>
            </div>

            {tipoDisciplina === "SEMANAL" && (
              <div className="form-group">
                <label>Dia da Semana *</label>
                <select value={diaSemana} onChange={e => setDiaSemana(e.target.value)}>
                  <option value="">Selecione...</option>
                  {DIAS_SEMANA.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
            )}

            <div className="form-group">
              <label>Turno</label>
              <select value={turno} onChange={e => setTurno(e.target.value)}>
                <option value="">Selecione...</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </select>
            </div>

            <div className="form-group">
              <label>Data de Início</label>
              <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>

            <div className="form-group">
              <label>Data de Término</label>
              <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>

          <button className="btn-primary" onClick={salvar}>
            {editandoId ? "Salvar alterações" : "+ Adicionar na Grade"}
          </button>

          <div className="modal-divider" />

          {alocacoesDisciplinas.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar por sala, turma, professor..."
                value={pesquisa}
                onChange={e => setPesquisa(e.target.value)}
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
              {alocacoesFiltradas.map(aloc => (
                <li key={aloc.id} className={`item-curso ${editandoId === aloc.id ? "item-editando" : ""}`}>
                  <div className="item-info">
                    <span className="item-nome">
                      {aloc.sala_nome} - {aloc.turma_nome}
                    </span>
                    <div className="item-meta">
                      <span className="pill">{aloc.disciplina_nome}</span>
                      <span className="pill">{aloc.tipo_disciplina}</span>
                    </div>
                  </div>
                  <div className="item-actions">
                    <button className="btn-edit" onClick={() => iniciarEdicao(aloc)}>Editar</button>
                    <button className="btn-delete" onClick={() => remover(aloc.id)}>Excluir</button>
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
