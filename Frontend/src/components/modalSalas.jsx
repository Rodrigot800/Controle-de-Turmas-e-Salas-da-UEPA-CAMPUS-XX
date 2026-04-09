import { useState,useEffect } from "react";
import "./modalSalas.css";


export default function ModalSalas({ salas, setSalas, onClose }) {
  useEffect(() => {
    carregarSalas();
  }, []);

  async function carregarSalas() {
    try {
      const response = await fetch("http://localhost:3001/salas");
      const data = await response.json();

      console.log("Salas vindas do banco:", data); 

      setSalas(data);
    } catch (err) {
      console.error("Erro ao carregar salas:", err);
    }
  }

  const [nome, setNome] = useState("");
  const [tipoSala, setTipoSala] = useState("comum");
  const [capacidade, setCapacidade] = useState("30");
  const [piso, setPiso] = useState("térreo");

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      alert("Por favor, insira um nome válido para a sala.");
      return false;
    }

    if (Number(capacidade) <= 0 || isNaN(capacidade)) {
      alert("Por favor, insira uma capacidade válida.");
      return false;
    }

    if (piso.trim() === "") {
      alert("Por favor, insira o piso da sala.");
      return false;
    }

    return true;
  }

  async function adicionarSala() {
    if (!validarEntrada()) return;

    const novaSala = {
      nome: nome.trim(),
      tipoSala: tipoSala,
      capacidade: Number(capacidade),
      piso: piso,
    };

    try {
      // Chamada ao backend
      const response = await fetch("http://localhost:3001/salas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaSala),
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao adicionar sala");
      }

      const salaCriada = await response.json(); // Retorna a sala criada com ID

      // Atualiza o estado local
      setSalas((salasAtuais) => [...salasAtuais, salaCriada]);

      // Limpa formulário
      setNome("");
      setCapacidade("30");
      setTipoSala("comum");
      setPiso("térreo");

      console.log("Sala adicionada com sucesso:", salaCriada);
      alert("Sala adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar sala:", err);
      alert("Não foi possível adicionar a sala: " + err.message);
    }
  }

  async function removerSala(id) {
    const confirmar = window.confirm(
      "Tem certeza que deseja excluir esta sala?",
    );
    if (!confirmar) return;

    try {
      // Chamada ao backend para deletar
      const response = await fetch(`http://localhost:3001/salas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const erro = await response.text();
        throw new Error(erro || "Erro ao deletar sala");
      }

      // Atualiza estado local
      const novasSalas = salas.filter((sala) => sala.id !== id);
      setSalas(novasSalas);

      console.log("Sala removida com sucesso:", id);
      alert("Sala removida com sucesso!");
    } catch (err) {
      console.error("Erro ao remover sala:", err);
      alert("Não foi possível remover a sala: " + err.message);
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <button className="btn-close-icon" onClick={onClose}>
          ×
        </button>

        <h2>Gerenciar Salas </h2>

        <div className="form-grid">
          <div className="form-grid">
            <div className="form-group">
              <label>Nome</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Sala 01"
              />
            </div>

            <div className="form-group">
              <label>Capacidade</label>
              <input
                type="number"
                value={capacidade}
                onChange={(e) => setCapacidade(e.target.value)}
                placeholder="30"
                step="10"
              />
            </div>

            <div className="form-group">
              <label>Piso</label>
              <select
                name="piso"
                id="piso"
                value={piso}
                onChange={(e) => setPiso(e.target.value)}
              >
                <option value="térreo">Térreo</option>
                <option value="1º andar">1º andar</option>
                <option value="2º andar">2º andar</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tipo da sala</label>
              <select
                value={tipoSala}
                onChange={(e) => setTipoSala(e.target.value)}
              >
                <option value="comum">Comum</option>
                <option value="laboratorio">Laboratório</option>
                <option value="informatica">Informática</option>
              </select>
            </div>
          </div>
        </div>

        <button className="btn-primary" onClick={adicionarSala}>
          Adicionar Sala
        </button>

        <ul className="lista-salas">
          {salas.map((sala) => (
            <li key={sala.id} className="linha-sala">
              <span>
                {sala.nome} | Cap: {sala.capacidade} | Piso: {sala.piso} |{" "}
                {sala.tipoSala}
              </span>

              <button
                className="btn-delete"
                onClick={() => removerSala(sala.id)}
                title="Excluir sala"
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
