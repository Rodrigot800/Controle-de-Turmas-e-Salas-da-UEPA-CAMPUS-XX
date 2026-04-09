import { useState } from "react";
import "./modalTurmas.css";

export default function ModalTurmas({ turmas, setTurmas, cursos, onClose }) {
  const [nome, setNome] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [turno, setTurno] = useState("");
  const [semestreInicio, setSemestreInicio] = useState(1);
  const [anoInicio, setAnoInicio] = useState(new Date().getFullYear());

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
    if (!semestreInicio || (semestreInicio != 2 && semestreInicio != 1)) {
      alert("Por favor, selecione um semestre válido (1° ou 2°).");
      return false;
    }
    if (
      !anoInicio ||
      Number(anoInicio) < 2000 ||
      Number(anoInicio) > new Date().getFullYear() + 5
    ) {
      alert("Por favor, insira um ano de início válido.");
      return false;
    }
    return true;
  }
  async function carregarTurmas() {
    try {
      const response = await fetch("http://localhost:3001/turmas");
      const turmasData = await response.json();

      // Converte os campos para camelCase
      const turmasConvertidas = turmasData.map((t) => ({
        id: t.id,
        nome: t.nome,
        cursoId: t.curso_id,
        semestreInicio: t.semestre_inicio,
        anoInicio: t.ano_inicio,
        turno: t.turno,
      }));

      setTurmas(turmasConvertidas);
    } catch (err) {
      console.error("Erro ao carregar turmas:", err.message);
    }
  }

  async function adicionarTurma() {
    if (!validarEntrada()) return;

    const novaTurma = {
      nome: nome.trim(),
      cursoId: Number(cursoId),
      semestreInicio: Number(semestreInicio),
      anoInicio: Number(anoInicio),
      turno: turno,
    };

    try {
      const response = await fetch("http://localhost:3001/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaTurma),
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao adicionar turma");
      }

      const turmaCriada = await response.json();
      setTurmas((prev) => [...prev, turmaCriada]);

      // Limpa o formulário
      setNome("");
      setCursoId("");
      setSemestreInicio(1);
      setAnoInicio(new Date().getFullYear());
      setTurno("");

      alert("Turma adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar turma:", err.message);
      alert("Erro ao adicionar turma: " + err.message);
    }
  }

  async function removerTurma(id) {
    // Pergunta de confirmação
    if (!window.confirm("Deseja remover esta turma?")) return;

    try {
      // Requisição DELETE para o backend
      const response = await fetch(`http://localhost:3001/turmas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        // Se o backend retornar erro, captura o texto
        const erro = await response.text();
        throw new Error(erro || "Erro ao remover a turma");
      }

      // Atualiza o estado local, removendo a turma deletada
      setTurmas(turmas.filter((t) => t.id !== id));

      alert("Turma removida com sucesso!");
    } catch (err) {
      console.error("Erro ao remover turma:", err.message);
      alert("Não foi possível remover a turma: " + err.message);
    }
  }


  function nomeCurso(cursoId) {
    const curso = cursos.find((c) => c.id_curso === cursoId);
    return curso ? curso.nome_curso : "Curso não encontrado";
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="btn-close" onClick={onClose}>
          ✕
        </button>

        <h2>Gerenciar Turmas</h2>

        <div className="form-grid">
          <div>
            <label>Nome da Turma</label>
            <input value={nome} onChange={(e) => setNome(e.target.value)} />
          </div>

          <div>
            <label>Curso</label>
            <select
              value={cursoId}
              onChange={(e) => setCursoId(e.target.value)}
            >
              {cursos.map((curso) => (
                <option key={curso.id_curso} value={curso.id_curso}>
                  {curso.nome_curso}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Turno</label>
            <select value={turno} onChange={(e) => setTurno(e.target.value)}>
              <option value="">Selecione o turno</option>
              <option value="Manhã">Manhã</option>
              <option value="Tarde">Tarde</option>
              <option value="Noite">Noite</option>
            </select>
          </div>

          <div>
            <label>Semestre</label>
            <select
              value={semestreInicio}
              onChange={(e) => setSemestreInicio(Number(e.target.value))}
            >
              <option value={1}>1º </option>
              <option value={2}>2º </option>
            </select>
          </div>

          <div>
            <label>Ano de Início</label>
            <input
              type="number"
              value={anoInicio}
              onChange={(e) => setAnoInicio(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-add" onClick={adicionarTurma}>
          Adicionar Turma
        </button>

        <ul className="lista">
          {turmas.map((turma) => (
            <li key={turma.id}>
              <span>
                {turma.nome} {turma.anoInicio} — {turma.turno} —{" "}
                {turma.semestreInicio}º — {nomeCurso(turma.cursoId)}
              </span>
              <button
                className="btn-delete"
                onClick={() => removerTurma(turma.id)}
              >
                X
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
