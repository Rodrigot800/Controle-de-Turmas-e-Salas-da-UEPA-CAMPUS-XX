import { useState, useEffect } from "react";
import "../style/modalSalas.css";
import "../style/modal.shared.css";
import API_BASE from "../config/api";

export default function ModalSalas({ salas, setSalas, onClose }) {
  const [nome, setNome] = useState("");
  const [tipoSala, setTipoSala] = useState("comum");
  const [capacidade, setCapacidade] = useState(30);
  const [piso, setPiso] = useState("térreo");
  const [carregando, setCarregando] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);

  useEffect(() => {
    carregarSalas();
  }, []);

  async function carregarSalas() {
    try {
      const response = await fetch(`${API_BASE}/salas`);
      if (!response.ok) throw new Error("Erro na resposta da API");
      const data = await response.json();
      setSalas(data);
      setModoOffline(false);
    } catch (err) {
      console.error("Erro ao carregar salas:", err);
      setModoOffline(true);
    } finally {
      setCarregando(false);
    }
  }

  function validarEntrada() {
    if (nome.trim() === "" || nome.length < 2) {
      alert("Por favor, insira um nome válido para a sala.");
      return false;
    }
    if (capacidade <= 0 || isNaN(capacidade)) {
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
      tipoSala,
      capacidade: Number(capacidade),
      piso,
    };

    if (modoOffline) {
      const salaTemp = { ...novaSala, id: Date.now() };
      setSalas((prev) => [...prev, salaTemp]);
      alert("⚠️ Modo offline: sala adicionada apenas localmente.");
      limparFormulario();
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/salas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novaSala),
      });

      if (!response.ok) throw new Error(await response.text());

      const salaCriada = await response.json();
      setSalas((prev) => [...prev, salaCriada]);
      limparFormulario();
      alert("Sala adicionada com sucesso!");
    } catch (err) {
      console.error("Erro ao adicionar sala:", err);
      alert("Não foi possível adicionar a sala: " + err.message);
    }
  }

  async function removerSala(id) {
    if (!window.confirm("Tem certeza que deseja excluir esta sala?")) return;

    if (modoOffline) {
      setSalas((prev) => prev.filter((s) => s.id !== id));
      alert("⚠️ Modo offline: sala removida apenas localmente.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/salas/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error(await response.text());

      setSalas((prev) => prev.filter((s) => s.id !== id));
      alert("Sala removida com sucesso!");
    } catch (err) {
      console.error("Erro ao remover sala:", err);
      alert("Não foi possível remover a sala: " + err.message);
    }
  }

  function limparFormulario() {
    setNome("");
    setCapacidade(30);
    setTipoSala("comum");
    setPiso("térreo");
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-left">
            <h2>Gerenciar salas</h2>
            <span className="modal-badge">{salas.length} cadastradas</span>
          </div>
          <button className="btn-close-icon" onClick={onClose}>
            ×
          </button>
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
                onChange={(e) => setCapacidade(Number(e.target.value))}
                step="10"
                min="1"
              />
            </div>

            <div className="form-group">
              <label>Piso</label>
              <select value={piso} onChange={(e) => setPiso(e.target.value)}>
                <option value="térreo">Térreo</option>
                <option value="1º andar">1º andar</option>
                <option value="2º andar">2º andar</option>
              </select>
            </div>

            <div className="form-group full">
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

          <button className="btn-primary" onClick={adicionarSala}>
            + Adicionar sala
          </button>

          <div className="modal-divider" />

          {/* Tabela */}
          <div className="table-container">
            {carregando ? (
              <p className="tabela-feedback">Carregando salas...</p>
            ) : salas.length === 0 ? (
              <p className="tabela-feedback">Nenhuma sala cadastrada.</p>
            ) : (
              <table className="table-salas">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Cap.</th>
                    <th>Piso</th>
                    <th>Tipo</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {salas.map((sala) => (
                    <tr key={sala.id}>
                      <td>{sala.nome}</td>
                      <td>{sala.capacidade}</td>
                      <td>{sala.piso}</td>
                      <td>
                        <span className={`tag ${sala.tipoSala}`}>
                          {sala.tipoSala}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => removerSala(sala.id)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
