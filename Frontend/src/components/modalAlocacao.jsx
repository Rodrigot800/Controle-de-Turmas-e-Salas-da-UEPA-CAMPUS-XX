import { useState, useEffect } from "react";
import "../style/modalAlocacao.css";

export default function ModalAlocacoes({
  turmas,
  salas,
  alocacoes,
  setAlocacoes,
  onClose,
}) {

const [turmasData, setTurmas] = useState([]);
const [salasData, setSalas] = useState([]);

useEffect(() => {
  carregarTurmas();
  carregarSalas();
  carregarAlocacoes();
}, []);

async function carregarTurmas() {
  try {
    const response = await fetch("http://localhost:3001/turmas");
    const data = await response.json();

    console.log("Turmas da API:", data);
    setTurmas(data);
  } catch (err) {
    console.error("Erro ao carregar turmas:", err);
  }
}

async function carregarSalas() {
  try {
    const response = await fetch("http://localhost:3001/salas");
    const data = await response.json();

    console.log("Salas da API:", data);
    setSalas(data);
  } catch (err) {
    console.error("Erro ao carregar salas:", err);
  }
}

async function carregarAlocacoes() {
  try {
    const response = await fetch("http://localhost:3001/alocacoes");
    const data = await response.json();

    console.log("Alocações da API:", data);
    setAlocacoes(data);
  } catch (err) {
    console.error("Erro ao carregar alocações:", err);
  }
}
  const [timeAlocacao, setTimeAlocacao] = useState("definitivo");
  var anoAtual = new Date().getFullYear();
  const [anoTemp, setAnoTemp] = useState(anoAtual);
  var semestreAtual = new Date().getMonth() < 6 ? 1 : 2;
  const [semestreTemp, setSemestreTemp] = useState(semestreAtual);

  const [turmaId, setTurmaId] = useState("");
  const [salaId, setSalaId] = useState("");
  const [turno, setTurno] = useState("");
  function selecionarTurma(id) {
    setTurmaId(id);

    const turma = turmas.find((t) => t.id === Number(id));
    if (turma) {
      setTurno(turma.turno); // turno vem da turma
    }
  }

  function validarEntrada() {
    if (!turmaId) {
      alert("Por favor, selecione uma turma.");
      return false;
    }
    if (!salaId) {
      alert("Por favor, selecione uma sala.");
      return false;
    }
    if (!turno) {
      alert("Por favor, selecione um turno.");
      return false;
    }
    if (timeAlocacao === "temporario") {
      if (!anoTemp) {
        alert("Informe o ano da alocação temporária.");
        return false;
      }
    }
    return true;
  }

  async function adicionarAlocacao() {
    if (!validarEntrada()) return;

    // Validação local
    const alocacaoExiste = alocacoes.some((a) => {
      if (a.salaId !== Number(salaId) || a.turno !== turno) return false;

      if (a.timeAlocacao === "definitivo") return true;

      if (timeAlocacao === "temporario" && a.timeAlocacao === "temporario") {
        return (
          a.anoAlocacaoTemp === Number(anoTemp) &&
          a.semestreAlocacaoTemp === Number(semestreTemp)
        );
      }

      return false;
    });

    if (alocacaoExiste) {
      alert(
        "Já existe uma alocação para esta sala e turno. Por favor, escolha outra sala ou turno.",
      );
      return;
    }

    // Cria objeto para enviar ao backend
    const novaAlocacao = {
      turmaId: Number(turmaId),
      salaId: Number(salaId),
      turno,
      timeAlocacao,
      anoTemp: timeAlocacao === "temporario" ? Number(anoTemp) : null,
      semestreTemp: timeAlocacao === "temporario" ? Number(semestreTemp) : null,
    };
    try {
      const response = await fetch("http://localhost:3001/alocacoes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaAlocacao),
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao adicionar alocação");
      }

      const alocacaoCriada = await response.json();

      // Atualiza estado local
      setAlocacoes((prev) => [...prev, alocacaoCriada]);

      // Limpa formulário
      setTurmaId("");
      setSalaId("");
      setTurno("");
      setTimeAlocacao("definitivo");
      setAnoTemp(anoAtual);
      setSemestreTemp(semestreAtual);

      alert("Alocação adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar alocação:", err.message);
      alert("Erro ao adicionar alocação: " + err.message);
    }
  }
  async function removerAlocacao(id) {
    if (!window.confirm("Deseja remover esta alocação?")) return;

    try {
      const response = await fetch(`http://localhost:3001/alocacoes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao remover alocação");
      }

      // Atualiza estado local
      setAlocacoes(alocacoes.filter((a) => a.id !== id));

      alert("Alocação removida com sucesso!");
    } catch (err) {
      console.error("Erro ao remover alocação:", err.message);
      alert("Não foi possível remover a alocação: " + err.message);
    }
  }
  function nomeTurma(id) {
    const t = turmas.find((t) => t.id === id);
    return t ? t.nome : "Turma não encontrada";
  }

function nomeSala(id) {
  const s = salas.find((s) => s.id === Number(id));
  return s 
    ? `${s.nome} (${s.tipoSala}) - ${s.capacidade} lugares`
    : "Sala não encontrada";
}
  console.log("SALAS:", salasData);
  console.log("ALOCACOES ATUAIS:", alocacoes);
 return (
  <div className="modal-backdrop">
    <div className="modal">
      <button className="btn-close" onClick={onClose}>
        ×
      </button>

      <h2>Alocar Turma em Sala</h2>

      <div className="form-grid">
        <div>
          <label>Turma</label>
          <select
            value={turmaId}
            onChange={(e) => selecionarTurma(e.target.value)}
          >
            <option value="">Selecione a turma</option>
            {turmasData.map((turma) => (
              <option key={turma.id} value={turma.id}>
                {turma.nome} {turma.ano_inicio}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Sala</label>
          <select value={salaId} onChange={(e) => setSalaId(e.target.value)}>
            <option value="">Selecione a sala</option>
            {salasData.map((sala) => (
              <option key={sala.id} value={sala.id}>
                {sala.nome} ({sala.tipoSala})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Turno</label>
          <select value={turno} onChange={(e) => setTurno(e.target.value)}>
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
            <option value="Noite">Noite</option>
          </select>
        </div>

        <div>
          <label>Tipo de Alocação</label>
          <select
            value={timeAlocacao}
            onChange={(e) => setTimeAlocacao(e.target.value)}
          >
            <option value="definitivo">Definitivo</option>
            <option value="temporario">Temporário</option>
          </select>
        </div>

        {timeAlocacao === "temporario" && (
          <div className="form-grid">
            <div>
              <label>Ano</label>
              <input
                type="number"
                value={anoTemp}
                onChange={(e) => setAnoTemp(e.target.value)}
              />
            </div>

            <div>
              <label>Semestre</label>
              <select
                value={semestreTemp}
                onChange={(e) => setSemestreTemp(e.target.value)}
              >
                <option value={1}>1º</option>
                <option value={2}>2º</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={adicionarAlocacao}>
        Alocar
      </button>

      <ul className="lista-salas">
  {alocacoes.map((a) => (
    <li key={a.id} className="linha-sala">
      <span>
        {nomeTurma(a.turma_id)} (
        {turmasData.find((t) => t.id === a.turma_id)?.ano_inicio || "N/A"})
        {" — "}
        {nomeSala(a.sala_id)}
        {" — "}
        {a.turno}
        {a.time_alocacao === "temporario" && (
          <span style={{ marginLeft: 8, color: "#666" }}>
            [{a.ano_temp}.{a.semestre_temp}]
          </span>
        )}
      </span>

      <button
        className="btn-delete"
        onClick={() => removerAlocacao(a.id)}
        title="Remover"
      >
        ✕
      </button>
    </li>
  ))}
</ul>
    </div>
  </div>
  );
}
