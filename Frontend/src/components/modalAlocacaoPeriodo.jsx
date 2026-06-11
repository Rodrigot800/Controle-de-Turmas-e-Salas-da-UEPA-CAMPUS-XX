import { useState, useRef } from "react";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalAlocacaoPeriodo({ 
  salas, 
  turmas,
  cursos = [], 
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
  const [reoferta, setReoferta] = useState(false);
  const [optativa, setOptativa] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [pesquisa, setPesquisa] = useState("");

  const [cursosExpandidos, setCursosExpandidos] = useState({});
  const [turmasExpandidas, setTurmasExpandidas] = useState({});

  const modalRef = useRef(null);
  const primeiroInputRef = useRef(null);

  // ── Derivados p/ filtros inteligentes ──────────────────
  // Curso da turma selecionada
  const turmaSelecionada = turmas.find(t => String(t.id) === String(turmaId));
  const cursoIdDaTurma = turmaSelecionada?.curso_id ?? null;

  // Semestre atual da turma
  let semestreAtualDaTurma = 99; // Fallback se não tiver turma
  if (turmaSelecionada && turmaSelecionada.ano_inicio && turmaSelecionada.semestre_inicio) {
    const dataAtual = new Date();
    const anoAtual = dataAtual.getFullYear();
    const semestreAtual = dataAtual.getMonth() + 1 <= 6 ? 1 : 2;
    
    const inicio = Number(turmaSelecionada.ano_inicio) * 2 + (Number(turmaSelecionada.semestre_inicio) === 2 ? 1 : 0);
    const atual = anoAtual * 2 + (semestreAtual === 2 ? 1 : 0);
    semestreAtualDaTurma = Math.max(1, atual - inicio + 1);
  }

  // Lista de disciplinas formatada e filtrada
  let disciplinasFiltradas = [];

  if (cursoIdDaTurma) {
    // Filtra disciplinas do curso baseando-se no seletor de reoferta e optativa
    const relacoesCurso = cursoDisciplinas.filter(cd => {
      const isAtual = cd.disciplina_atual !== false && 
                      cd.disciplina_atual !== 'false' && 
                      cd.disciplina_atual !== 0 && 
                      cd.disciplina_atual !== 'f';
      
      const ehDessaTurma = Number(cd.curso_id) === Number(cursoIdDaTurma);
      if (!ehDessaTurma) return false;

      // Se for a disciplina atualmente selecionada, mostramos sempre para não quebrar a UI
      const ehEdicao = Number(cd.disciplina_id) === Number(disciplinaId);

      const cdOptativa = cd.disciplina_optativa === true || 
                         cd.disciplina_optativa === 'true' || 
                         cd.disciplina_optativa === 1 || 
                         cd.disciplina_optativa === 't';

      if (optativa) {
        if (!cdOptativa && !ehEdicao) return false;
      } else {
        if (cdOptativa && !ehEdicao) return false;
      }

      if (cdOptativa) {
        return isAtual || ehEdicao;
      }

      if (reoferta) {
        // Mostra TODAS as disciplinas de semestres anteriores (independente de disciplina_atual)
        return cd.semestre_disciplina < semestreAtualDaTurma || ehEdicao;
      } else {
        // Mostra apenas as disciplinas do semestre atual da turma (ativas)
        return (cd.semestre_disciplina === semestreAtualDaTurma && (isAtual || ehEdicao));
      }
    });
    
    // Ordem decrescente de semestres (do semestre atual pra trás)
    relacoesCurso.sort((a, b) => (b.semestre_disciplina || 0) - (a.semestre_disciplina || 0));

    disciplinasFiltradas = relacoesCurso.map(cd => {
      const disc = disciplinas.find(d => d.id === cd.disciplina_id);
      if (!disc) return null;
      const cdOptativa = cd.disciplina_optativa === true || 
                         cd.disciplina_optativa === 'true' || 
                         cd.disciplina_optativa === 1 || 
                         cd.disciplina_optativa === 't';
      return {
        ...disc,
        nomeFormatado: cdOptativa 
          ? `[Optativa] ${disc.nome}` 
          : (cd.semestre_disciplina ? `${cd.semestre_disciplina}º Sem - ${disc.nome}` : disc.nome)
      };
    }).filter(Boolean);
  } else {
    // Se não selecionou turma ainda, mostra todas
    disciplinasFiltradas = disciplinas.map(d => ({ ...d, nomeFormatado: d.nome }));
  }

  // Professores filtrados pelo curso (e opcionalmente pela disciplina via curso)
  const professoresFiltrados = cursoIdDaTurma
    ? professores.filter(p => p.cursos_ids && (p.cursos_ids.includes(Number(cursoIdDaTurma)) || p.cursos_ids.includes(String(cursoIdDaTurma))))
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

  function formatarDataBR(dataIso) {
    if (!dataIso) return "";
    const [ano, mes, dia] = dataIso.split("T")[0].split("-");
    return `${dia}/${mes}`;
  }

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

  function toggleCurso(id) {
    setCursosExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  }

  function toggleTurma(cursoId, tNome) {
    const key = `${cursoId}-${tNome}`;
    setTurmasExpandidas(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function formatarDataEnvio(data) {
    if (!data) return null;
    return data;
  }

  function normalizarTurnoCapitalizado(turno) {
    if (!turno) return "";
    const t = turno.toLowerCase();
    if (t.includes("manh") || t.includes("manhã")) return "Manhã";
    if (t.includes("tard")) return "Tarde";
    if (t.includes("noit")) return "Noite";
    return turno;
  }

  function handleTurmaChange(novoTurmaId) {
    setTurmaId(novoTurmaId);
    setDisciplinaId("");
    setProfessorId("");
    setReoferta(false);
    setOptativa(false);
    // Preencher turno automaticamente da turma
    const turma = turmas.find(t => String(t.id) === String(novoTurmaId));
    if (turma?.turno) setTurno(normalizarTurnoCapitalizado(turma.turno));
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
    setDisciplinaId(aloc.disciplina_id || "optativa");
    setProfessorId(aloc.professor_id || "");
    setTurno(aloc.turno ? normalizarTurnoCapitalizado(aloc.turno) : "Manhã");
    setTipoDisciplina(aloc.tipo_disciplina || "MODULAR");
    setDiaSemana(aloc.dia_semana ?? "");
    setReoferta(aloc.reoferta || false);
    
    const isAlocOptativa = !aloc.disciplina_id || 
      cursoDisciplinas.some(cd => 
        Number(cd.disciplina_id) === Number(aloc.disciplina_id) && 
        (cd.disciplina_optativa === true || cd.disciplina_optativa === 'true' || cd.disciplina_optativa === 1 || cd.disciplina_optativa === 't')
      );
    setOptativa(isAlocOptativa);

    setDataInicio(aloc.data_inicio ? aloc.data_inicio.split('T')[0] : "");
    setDataFim(aloc.data_fim ? aloc.data_fim.split('T')[0] : "");
    
    if (modalRef.current) {
      modalRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }

    setTimeout(() => {
      primeiroInputRef.current?.focus();
    }, 150);
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
      disciplina_id: disciplinaId === "optativa" || !disciplinaId ? null : Number(disciplinaId),
      professor_id: professorId ? Number(professorId) : null,
      turno: turno || null,
      tipo_disciplina: tipoDisciplina,
      dia_semana: tipoDisciplina === "SEMANAL" ? Number(diaSemana) : null,
      data_inicio: formatarDataEnvio(dataInicio),
      data_fim: formatarDataEnvio(dataFim),
      reoferta: reoferta
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
      const disc = disciplinaId === "optativa" || !disciplinaId ? { nome: "Optativa" } : disciplinas.find(d => d.id === Number(disciplinaId));
      const prof = professores.find(p => p.id === Number(professorId));
      const sala = salas.find(s => s.id === Number(salaId));

      const alocacaoCompleta = {
        ...alocacaoSalva,
        turma_nome: turma?.nome,
        ano_inicio: turma?.ano_inicio ?? null,
        disciplina_nome: disc?.nome || "Optativa",
        professor_nome: prof?.nome,
        sala_nome: sala?.nome,
        reoferta: alocacaoSalva.reoferta
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
    setReoferta(false);
    setOptativa(false);
  }

  const alocacoesFiltradas = alocacoesDisciplinas.filter(aloc => {
    const termo = pesquisa.toLowerCase();
    const txtSala = aloc.sala_nome?.toLowerCase() || "";
    const txtTurma = aloc.turma_nome?.toLowerCase() || "";
    const txtDisc = aloc.disciplina_nome?.toLowerCase() || "optativa" ;
    const txtProf = aloc.professor_nome?.toLowerCase() || "";
    
    return txtSala.includes(termo) || txtTurma.includes(termo) || txtDisc.includes(termo) || txtProf.includes(termo);
  });

  const groupedData = {};
  groupedData["sem-curso"] = { nome: "Sem curso vinculado", turmas: { "null": [] } };
  cursos.forEach(c => { groupedData[c.id] = { nome: c.nome, turmas: {} }; });

  alocacoesFiltradas.forEach(aloc => {
    let cId = "sem-curso";
    let tNome = "null";

    const turma = turmas.find(t => Number(t.id) === Number(aloc.turma_id));
    if (turma) {
      if (groupedData[turma.curso_id]) cId = turma.curso_id;
      tNome = `${turma.nome} ${turma.ano_inicio ? `(${turma.ano_inicio})` : ""}`;
    } else if (aloc.turma_nome) {
      tNome = aloc.turma_nome;
    }

    if (!groupedData[cId].turmas[tNome]) groupedData[cId].turmas[tNome] = [];
    groupedData[cId].turmas[tNome].push(aloc);
  });

  return (
    <div className="modal-backdrop">
      <div className="modal" ref={modalRef}>
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar Alocação" : "Nova Alocação"}</h2>
            <span className="modal-badge">{alocacoesDisciplinas.length} aloc.</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {editandoId && (
            <div className="edit-banner">
              <span>Editando alocação</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>Cancelar</button>
            </div>
          )}

          <div className="form-grid">
            <div className="form-group">
              <label>Sala *</label>
              <select ref={primeiroInputRef} value={salaId} onChange={e => setSalaId(e.target.value)}>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <label style={{ margin: 0 }}>Disciplina *</label>
                {turmaId && (
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#4b5563', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={reoferta} 
                        onChange={e => {
                          setReoferta(e.target.checked);
                          if (e.target.checked) setOptativa(false);
                          setDisciplinaId("");
                        }} 
                        style={{ width: '14px', height: '14px', cursor: 'pointer', margin: 0 }}
                      />
                      Reoferta
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: '500', color: '#4b5563', cursor: 'pointer', margin: 0 }}>
                      <input 
                        type="checkbox" 
                        checked={optativa} 
                        onChange={e => {
                          setOptativa(e.target.checked);
                          if (e.target.checked) setReoferta(false);
                          setDisciplinaId("");
                        }} 
                        style={{ width: '14px', height: '14px', cursor: 'pointer', margin: 0 }}
                      />
                      Optativa
                    </label>
                  </div>
                )}
              </div>
              <select value={disciplinaId} onChange={e => handleDisciplinaChange(e.target.value)} disabled={!turmaId} style={{ marginTop: '6px' }}>
                <option value="">{turmaId ? "Selecione a Disciplina" : "Selecione uma turma primeiro"}</option>
                {disciplinasFiltradas.map(d => <option key={d.id} value={d.id}>{d.nomeFormatado}</option>)}
                {turmaId && <option value="optativa">Optativa</option>}
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
                Regular
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
            {editandoId ? "Salvar" : "Alocar"}
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
            <div className="accordion-container" style={{ marginTop: '16px' }}>
              {Object.keys(groupedData).map(cId => {
                const cursoData = groupedData[cId];
                const turmasKeys = Object.keys(cursoData.turmas);
                const hasAlocacoes = turmasKeys.some(t => cursoData.turmas[t].length > 0);
                
                if (!hasAlocacoes) return null;

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
                        {turmasKeys.sort((a,b) => a.localeCompare(b)).map(tNome => {
                          const alocacoesDaTurma = cursoData.turmas[tNome];
                          if (alocacoesDaTurma.length === 0) return null;

                          const tKey = `${cId}-${tNome}`;
                          const isTurmaExpanded = turmasExpandidas[tKey];

                          return (
                            <div key={tKey} className="accordion-semestre" style={{ marginBottom: '8px', paddingRight: '16px' }}>
                              <div 
                                onClick={() => toggleTurma(cId, tNome)}
                                style={{ padding: '8px 12px', background: '#eff6ff', borderRadius: '4px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#1d4ed8', fontWeight: '500', marginBottom: isTurmaExpanded ? '4px' : '0', fontSize: '13px' }}
                              >
                                <span>{tNome === "null" ? "Turma Desconhecida" : `Turma: ${tNome}`}</span>
                                <span>{isTurmaExpanded ? "▼" : "▶"}</span>
                              </div>

                              {isTurmaExpanded && (
                                <ul style={{ padding: 0, margin: 0, listStyle: 'none', width: '100%', border: '1px solid #f0f0f0', borderTop: 'none', borderRadius: '0 0 4px 4px' }}>
                                  {alocacoesDaTurma.map((aloc) => {
                                    const inicio = formatarDataBR(aloc.data_inicio);
                                    const fim = formatarDataBR(aloc.data_fim);
                                    let periodoTexto = "Período indefinido";
                                    if (inicio && fim) periodoTexto = `${inicio} a ${fim}`;
                                    else if (inicio) periodoTexto = `A partir de ${inicio}`;
                                    else if (fim) periodoTexto = `Até ${fim}`;

                                    return (
                                    <li key={aloc.id} className={`item-curso ${editandoId === aloc.id ? "item-editando" : ""}`} style={{ borderBottom: '1px solid #f0f0f0', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div className="item-info">
                                        <span className="item-nome">
                                          {aloc.disciplina_nome || "Optativa"} <span style={{ fontWeight: 'normal', color: '#6b7280', fontSize: '13px' }}>— {aloc.sala_nome}</span>
                                        </span>
                                        <div className="item-meta">
                                          {aloc.turno && <span className="pill" style={{ background: '#e0e7ff', color: '#3730a3' }}>{aloc.turno}</span>}
                                          <span className="pill" style={{ background: '#f3f4f6', color: '#4b5563' }}>{periodoTexto}</span>
                                          <span className="pill">{aloc.tipo_disciplina}</span>
                                          {aloc.professor_nome && <span className="pill" style={{ background: '#fef3c7', color: '#92400e' }}>Prof: {aloc.professor_nome}</span>}
                                        </div>
                                      </div>
                                      <div className="item-actions">
                                        <button className="btn-edit" onClick={() => iniciarEdicao(aloc)} style={{ border: '1px solid #e5e7eb', background: '#fff', color: '#6b7280', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}>Editar</button>
                                        <button className="btn-delete" onClick={() => remover(aloc.id)}>Excluir</button>
                                      </div>
                                    </li>
                                    );
                                  })}
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
