import { useState, useEffect } from "react";
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
  onDataChange,
}) {
  const anoAtual = new Date().getFullYear();
  const semestreAtual = new Date().getMonth() < 6 ? 1 : 2;

  const [turmasData, setTurmasData] = useState([]);
  const [salasData, setSalasData] = useState([]);
  const [turmaId, setTurmaId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [turno, setTurno] = useState("manhã");
  const [timeAlocacao, setTimeAlocacao] = useState("definitivo");
  const [anoTemp, setAnoTemp] = useState(anoAtual);
  const [semestreTemp, setSemestreTemp] = useState(semestreAtual);
  const [carregando, setCarregando] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const { alert, showAlert, showConfirm, error, success } = useAlert();

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [turmasRes, salasRes, alocacoesRes] = await Promise.all([
        fetch(`${API_BASE}/turmas`),
        fetch(`${API_BASE}/salas`),
        fetch(`${API_BASE}/alocacoes`),
      ]);

      const [turmasJson, salasJson, alocacoesJson] = await Promise.all([
        turmasRes.json(),
        salasRes.json(),
        alocacoesRes.json(),
      ]);

      setTurmasData(turmasJson);
      setSalasData(salasJson);
      setAlocacoes(alocacoesJson);
      setModoOffline(false);
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      setModoOffline(true);
    } finally {
      setCarregando(false);
    }
  }

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

  async function adicionarAlocacao() {
    if (!validarEntrada()) return;

    const alocacaoExiste = alocacoes.some((a) => {
      if (Number(a.sala_id) !== Number(salaId) || a.turno !== turno)
        return false;
      if (a.time_alocacao === "definitivo") return true;
      if (timeAlocacao === "temporario" && a.time_alocacao === "temporario") {
        return (
          Number(a.ano_temp) === Number(anoTemp) &&
          Number(a.semestre_temp) === Number(semestreTemp)
        );
      }
      return false;
    });

    if (alocacaoExiste) {
      error("Já existe uma alocação para esta sala e turno.");
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
          <h2>Alocar turma em sala</h2>
          <div className="header-right">
            <span className="modal-badge">{alocacoes.length} alocações</span>
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
              <label>Turma</label>
              <select
                value={turmaId}
                onChange={(e) => selecionarTurma(e.target.value)}
              >
                <option value="">Selecione a turma</option>
                {turmasData.map((t) => (
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
                {salasData.map((s) => (
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

          <button className="btn-primary" onClick={adicionarAlocacao}>
            + Alocar turma
          </button>

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
          {carregando ? (
            <p className="lista-feedback">Carregando alocações...</p>
          ) : alocacoes.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação cadastrada.</p>
          ) : alocacoesFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma alocação encontrada.</p>
          ) : (
            <ul className="lista-alocacoes">
              {alocacoesFiltradas.map((a) => {
                const turma = turmasData.find((t) => t.id === a.turma_id);

                return (
                  <li key={a.id} className="item-alocacao">
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

                    <button
                      className="btn-delete"
                      onClick={() => removerAlocacao(a.id)}
                    >
                      Excluir
                    </button>
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
