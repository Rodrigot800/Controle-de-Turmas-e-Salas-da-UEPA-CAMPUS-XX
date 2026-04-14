import { useState } from "react";
import "../style/modalAlocacao.css";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalAlocacoes({
  turmas,
  salas,
  alocacoes,
  setAlocacoes,
  onClose,
}) {
  const anoAtual = new Date().getFullYear();
  const semestreAtual = new Date().getMonth() < 6 ? 1 : 2;

  const [turmaId, setTurmaId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [turno, setTurno] = useState("manhã");
  const [timeAlocacao, setTimeAlocacao] = useState("definitivo");
  const [anoTemp, setAnoTemp] = useState(anoAtual);
  const [semestreTemp, setSemestreTemp] = useState(semestreAtual);
  const [pesquisa, setPesquisa] = useState("");

  // Estados de edição
  const [editandoId, setEditandoId] = useState(null);

  const { alert, showAlert, showConfirm, error, success } = useAlert();

  function selecionarTurma(id) {
    setTurmaId(id);
    const turma = turmas.find((t) => t.id === Number(id));
    if (turma) setTurno(turma.turno);
  }

  function validarEntrada() {
    if (!turmaId) {
      error("Por favor, selecione uma turma.");
      return false;
    }
    if (!salaId) {
      error("Por favor, selecione uma sala.");
      return false;
    }
    if (!turno) {
      error("Por favor, selecione um turno.");
      return false;
    }
    if (timeAlocacao === "temporario" && !anoTemp) {
      error("Informe o ano da alocação temporária.");
      return false;
    }
    return true;
  }

  // Preenche o formulário com os dados da alocação e entra em modo edição
  function iniciarEdicao(alocacao) {
    setEditandoId(alocacao.id);
    setTurmaId(alocacao.turma_id);
    setSalaId(alocacao.sala_id);
    setTurno(alocacao.turno);
    setTimeAlocacao(alocacao.time_alocacao);
    setAnoTemp(alocacao.ano_temp || anoAtual);
    setSemestreTemp(alocacao.semestre_temp || semestreAtual);
    // Scroll suave pro topo do formulário
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    limparFormulario();
  }

  async function salvarEdicao() {
    if (!validarEntrada()) return;

    const alocacaoAtualizada = {
      turmaId: Number(turmaId),
      salaId: Number(salaId),
      turno,
      timeAlocacao,
      anoTemp: timeAlocacao === "temporario" ? Number(anoTemp) : null,
      semestreTemp: timeAlocacao === "temporario" ? Number(semestreTemp) : null,
    };

    try {
      const response = await fetch(`${API_BASE}/alocacoes/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(alocacaoAtualizada),
      });

      if (!response.ok) throw new Error(await response.text());

      const alocacaoEditada = await response.json();

      // Substitui a alocação antiga pela editada no estado
      setAlocacoes((prev) =>
        prev.map((a) => (a.id === editandoId ? alocacaoEditada : a)),
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

    // Se está editando, salva a edição em vez de adicionar
    if (editandoId) {
      salvarEdicao();
      return;
    }

    const novaAlocacao = {
      turmaId: Number(turmaId),
      salaId: Number(salaId),
      turno,
      timeAlocacao,
      anoTemp: timeAlocacao === "temporario" ? Number(anoTemp) : null,
      semestreTemp: timeAlocacao === "temporario" ? Number(semestreTemp) : null,
    };

    try {
      const response = await fetch(`${API_BASE}/alocacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaAlocacao),
      });

      if (!response.ok) throw new Error(await response.text());

      const alocacaoCriada = await response.json();
      setAlocacoes((prev) => [...prev, alocacaoCriada]);
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
          const response = await fetch(`${API_BASE}/alocacoes/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error(await response.text());
          setAlocacoes((prev) => prev.filter((a) => a.id !== id));
          success("Alocação removida com sucesso!");
        } catch (err) {
          console.error("Erro ao remover alocação:", err.message);
          error("Não foi possível remover a alocação: " + err.message);
        }
      },
      null,
      "Excluir alocação?"
    );
  }

  function limparFormulario() {
    setTurmaId("");
    setSalaId("");
    setTurno("manhã");
    setTimeAlocacao("definitivo");
    setAnoTemp(anoAtual);
    setSemestreTemp(semestreAtual);
  }

  function nomeTurma(id) {
    const t = turmas.find((t) => t.id === id);
    return t ? t.nome : "—";
  }

  function nomeSala(id) {
    const s = salas.find((s) => s.id === Number(id));
    return s ? `${s.nome} (${s.tipoSala})` : "—";
  }

  const alocacoesFiltradas = alocacoes.filter((alocacao) => {
    const turma = turmas.find((t) => t.id === alocacao.turma_id);
    const sala = salas.find((s) => s.id === alocacao.sala_id);
    const nomeTurmaStr = turma ? turma.nome : "";
    const nomeSalaStr = sala ? sala.nome : "";
    return (
      nomeTurmaStr.toLowerCase().includes(pesquisa.toLowerCase()) ||
      nomeSalaStr.toLowerCase().includes(pesquisa.toLowerCase()) ||
      alocacao.turno.toLowerCase().includes(pesquisa.toLowerCase())
    );
  });

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>{editandoId ? "Editar alocação" : "Alocar turma em sala"}</h2>
            <span className="modal-badge">{alocacoes.length} alocações</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-body">
          {/* Banner de modo edição */}
          {editandoId && (
            <div className="edit-banner">
              <span>Editando alocação — preencha os campos e salve</span>
              <button className="edit-banner-cancel" onClick={cancelarEdicao}>
                Cancelar
              </button>
            </div>
          )}
          {/* Formulário */}
          <div className="form-grid">
            <div className="form-group full">
              <label>Turma</label>
              <select
                value={turmaId}
                onChange={(e) => selecionarTurma(e.target.value)}
              >
                <option value="">Selecione a turma</option>
                {turmas.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome} — {t.ano_inicio}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full">
              <label>Sala</label>
              <select
                value={salaId}
                onChange={(e) => setSalaId(e.target.value)}
              >
                <option value="">Selecione a sala</option>
                {salas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.tipoSala})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Turno</label>
              <select value={turno} onChange={(e) => setTurno(e.target.value)}>
                <option value="manhã">Manhã</option>
                <option value="tarde">Tarde</option>
                <option value="noite">Noite</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo de alocação</label>
              <select
                value={timeAlocacao}
                onChange={(e) => setTimeAlocacao(e.target.value)}
              >
                <option value="definitivo">Definitivo</option>
                <option value="temporario">Temporário</option>
              </select>
            </div>

            {/* Campos extras só para temporário */}
            {timeAlocacao === "temporario" && (
              <div className="temp-box">
                <span className="temp-label">Período temporário</span>
                <div className="form-group">
                  <label>Ano</label>
                  <input
                    type="number"
                    value={anoTemp}
                    onChange={(e) => setAnoTemp(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label>Semestre</label>
                  <select
                    value={semestreTemp}
                    onChange={(e) => setSemestreTemp(Number(e.target.value))}
                  >
                    <option value={1}>1º semestre</option>
                    <option value={2}>2º semestre</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Botão muda conforme o modo */}
          {editandoId ? (
            <button className="btn-primary btn-save" onClick={salvarEdicao}>
              Salvar alterações
            </button>
          ) : (
            <button className="btn-primary" onClick={adicionarAlocacao}>
              + Alocar turma
            </button>
          )}

          <div className="modal-divider" />

          {/* Barra de pesquisa */}
          {alocacoes.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar alocações..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* Lista */}
          {alocacoes.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação cadastrada.</p>
          ) : alocacoesFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação encontrada.</p>
          ) : (
            <ul className="lista-alocacoes">
              {alocacoesFiltradas.map((a) => {
                const turma = turmas.find((t) => t.id === a.turma_id);

                return (
                  <li
                    key={a.id}
                    className={`item-alocacao ${editandoId === a.id ? "item-editando" : ""}`}
                  >
                    <div className="item-info">
                      <span className="item-nome">
                        {nomeTurma(a.turma_id)} ({turma?.ano_inicio || "N/A"})
                      </span>

                      <div className="item-meta">
                        <span className="pill sala">{nomeSala(a.sala_id)}</span>

                        <span className="pill turno">{a.turno}</span>

                        {a.time_alocacao === "temporario" ? (
                          <span className="pill temporario">
                            {a.ano_temp}.{a.semestre_temp}
                          </span>
                        ) : (
                          <span className="pill definitivo">Definitivo</span>
                        )}
                      </div>
                    </div>

                    <div className="item-actions">
                      <button
                        className="btn-edit"
                        onClick={() => iniciarEdicao(a)}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => removerAlocacao(a.id)}
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
