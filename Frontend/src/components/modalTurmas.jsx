import { useState, useEffect } from "react";
import "../style/modalTurmas.css";
import "../style/modal.shared.css";

import API_BASE from "../config/api";

export default function ModalTurmas({ turmas, setTurmas, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [turno, setTurno] = useState("");
  const [semestreInicio, setSemestreInicio] = useState(1);
  const [anoInicio, setAnoInicio] = useState(new Date().getFullYear());
  const [carregando, setCarregando] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);

  useEffect(() => {
    carregarTurmas();
  }, []);

  async function carregarTurmas() {
    try {
      const response = await fetch(`${API_BASE}/turmas`);
      if (!response.ok) throw new Error("Erro na resposta da API");
      const data = await response.json();
      setTurmas(data);
      setModoOffline(false);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err);
      setModoOffline(true);
    } finally {
      setCarregando(false);
    }
  }

  function validarEntrada() {
    if (!nome || nome.trim().length < 2) {
      alert("Por favor, insira um nome válido para a turma.");
      return false;
    }
    if (!cursoId) {
      alert("Por favor, selecione um curso.");
      return false;
    }
    if (!turno) {
      alert("Por favor, selecione um turno.");
      return false;
    }
    if (semestreInicio !== 1 && semestreInicio !== 2) {
      alert("Por favor, selecione um semestre válido (1º ou 2º).");
      return false;
    }
    if (!anoInicio || anoInicio < 2000 || anoInicio > new Date().getFullYear() + 5) {
      alert("Por favor, insira um ano de início válido.");
      return false;
    }
    return true;
  }

  async function adicionarTurma() {
    if (!validarEntrada()) return;

    const novaTurma = {
      nome: nome.trim(),
      cursoId: Number(cursoId),
      semestreInicio: Number(semestreInicio),
      anoInicio: Number(anoInicio),
      turno,
    };

    if (modoOffline) {
      const turmaTemp = { ...novaTurma, id: Date.now(), curso_id: novaTurma.cursoId, ano_inicio: novaTurma.anoInicio, semestre_inicio: novaTurma.semestreInicio };
      setTurmas((prev) => [...prev, turmaTemp]);
      alert("⚠️ Modo offline: turma adicionada apenas localmente.");
      limparFormulario();
      return;
    }

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
      alert("Turma adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar turma:", err.message);
      alert("Erro ao adicionar turma: " + err.message);
    }
  }

  async function removerTurma(id) {
    if (!window.confirm("Deseja remover esta turma?")) return;

    if (modoOffline) {
      setTurmas((prev) => prev.filter((t) => t.id !== id));
      alert("⚠️ Modo offline: turma removida apenas localmente.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/turmas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(await response.text());

      setTurmas((prev) => prev.filter((t) => t.id !== id));
      alert("Turma removida com sucesso!");
    } catch (err) {
      console.error("Erro ao remover turma:", err.message);
      alert("Não foi possível remover a turma: " + err.message);
    }
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

  return (
    <div className="modal-backdrop">
      <div className="modal modal-turmas">
        {/* Header */}
        <div className="modal-header">
          <h2>Gerenciar turmas</h2>
          <div className="header-right">
            <span className="modal-badge">{turmas.length} cadastradas</span>
            <button className="btn-close-icon" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Banner offline */}
          {modoOffline && (
            <div className="offline-badge">
              <span className="offline-dot" />
              API indisponível — exibindo dados locais
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

          <button className="btn-primary" onClick={adicionarTurma}>
            + Adicionar turma
          </button>

          <div className="modal-divider" />

          {/* Lista */}
          {carregando ? (
            <p className="lista-feedback">Carregando turmas...</p>
          ) : turmas.length === 0 ? (
            <p className="lista-feedback">Nenhuma turma cadastrada.</p>
          ) : (
            <ul className="lista-turmas">
              {turmas.map((turma) => (
                <li key={turma.id} className="item-turma">
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
                  <button
                    className="btn-delete"
                    onClick={() => removerTurma(turma.id)}
                  >
                    Excluir
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}