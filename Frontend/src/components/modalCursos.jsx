import { useState, useEffect } from "react";
import "../style/modalCursos.css";

export default function ModalCursos({ cursos, setCursos, onClose }) {

  useEffect(() => {
    fetch("http://localhost:3001/cursos")
      .then((res) => res.json())
      .then((data) => {
        console.log("Cursos do banco:", data);
        setCursos(data);
      })
      .catch((error) => console.error("Erro ao buscar cursos:", error));
  }, []);

  const [nome, setnome] = useState("");
  const [vagas, setVagas] = useState("30");
  const [semestres, setSemestres] = useState("8");

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      alert("Por favor, insira um nome válido para o curso.");
      return false;
    }
    if (vagas <= 0 || Number(vagas) === false) {
      alert("Por favor, insira uma quantidade válida de vagas.");
      return false;
    }
    if (semestres <= 0 || Number(semestres) === false) {
      alert("Por favor, insira uma quantidade válida de semestres.");
      return false;
    }
    return true;
  }
  async function adicionarCurso() {
    if (!validarEntrada()) return;

    const novoCurso = {
      nome: nome.trim(), // nome correto para o backend
      vagas: Number(vagas),
      semestres: Number(semestres),
    };

    try {
      const response = await fetch("http://localhost:3001/cursos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoCurso),
      });

      if (!response.ok) {
        // pega o erro do backend
        const erro = await response.json(); // backend envia { erro: "mensagem" }
        throw new Error(erro.erro || "Erro ao adicionar curso");
      }

      const cursoCriado = await response.json();
      setCursos((prev) => [...prev, cursoCriado]);

      // Limpa o formulário
      setnome("");
      setVagas("30");
      setSemestres("8");

      console.log("Curso criado:", cursoCriado);
      alert("Curso adicionado com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar curso:", err.message);
      alert("Erro ao adicionar curso: " + err.message); // <-- aqui aparece o erro
    }
  }
  async function removerCurso(id) {
    if (!window.confirm("Deseja remover este curso?")) return;

    try {
      const response = await fetch(`http://localhost:3001/cursos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao remover curso");
      }

      // Atualiza estado local removendo o curso deletado
      setCursos(cursos.filter((c) => c.id !== id));

      alert("Curso removido com sucesso!");
    } catch (err) {
      console.error("Erro ao remover curso:", err.message);
      alert("Não foi possível remover o curso: " + err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="btn-close" onClick={onClose}>
          ×
        </button>

        <h2>Gerenciar Cursos</h2>

        <div className="form-grid">
          <div className="form-group">
            <label>Nome do curso</label>
            <input
              value={nome}
              onChange={(e) => setnome(e.target.value)}
              placeholder="Ex: Engenharia Ambiental"
            />
          </div>

          <div className="form-group">
            <label>Vagas</label>
            <input
              type="number"
              value={vagas}
              onChange={(e) => setVagas(e.target.value)}
              placeholder="40"
              step="10"
            />
          </div>

          <div className="form-group">
            <label>Semestres</label>
            <input
              type="number"
              value={semestres}
              onChange={(e) => setSemestres(e.target.value)}
              placeholder="10"
              step="2"
            />
          </div>
        </div>

        <button className="btn-primary" onClick={adicionarCurso}>
          Adicionar Curso
        </button>

        <ul className="lista-salas">
          {cursos.map((curso) => (
            <li key={curso.id} className="linha-sala">
              <span>
                {curso.nome} — {curso.vagas} vagas — {curso.semestres} semestres
              </span>
              <button
                className="btn-delete"
                onClick={() => removerCurso(curso.id)}
                title="Excluir"
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
