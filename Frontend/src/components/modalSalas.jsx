import { useState, useEffect } from "react";
import "../style/modalSalas.css";
import "../style/modal.shared.css";
import AlertModal from "./AlertModal";
import { useAlert } from "../hooks/useAlert";
import API_BASE from "../config/api";

export default function ModalSalas({ salas, setSalas, onClose, onDataChange }) {
  const [nome, setNome] = useState("");
  const [tipoSala, setTipoSala] = useState("comum");
  const [capacidade, setCapacidade] = useState(30);
  const [piso, setPiso] = useState("térreo");
  const [carregando, setCarregando] = useState(true);
  const [modoOffline, setModoOffline] = useState(false);
  const [pesquisa, setPesquisa] = useState("");
  const { alert, showAlert, showConfirm, error, success } = useAlert();

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
      error("Por favor, insira um nome válido para a sala.");
      return false;
    }
    if (capacidade <= 0 || isNaN(capacidade)) {
      error("Por favor, insira uma capacidade válida.");
      return false;
    }
    if (piso.trim() === "") {
      error("Por favor, insira o piso da sala.");
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
      showAlert("Sala adicionada apenas localmente (modo offline).", "Modo Offline");
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
      success("Sala adicionada com sucesso!");
      // Notifica o componente pai que dados foram alterados
      onDataChange?.();
    } catch (err) {
      console.error("Erro ao adicionar sala:", err);
      error("Não foi possível adicionar a sala: " + err.message);
    }
  }

  async function removerSala(id) {
    showConfirm(
      "Esta ação não pode ser desfeita.",
      async () => {
        if (modoOffline) {
          setSalas((prev) => prev.filter((s) => s.id !== id));
          showAlert("Sala removida apenas localmente (modo offline).", "Modo Offline");
          return;
        }

        try {
          const response = await fetch(`${API_BASE}/salas/${id}`, {
            method: "DELETE",
          });

          if (!response.ok) throw new Error(await response.text());

          setSalas((prev) => prev.filter((s) => s.id !== id));
          success("Sala removida com sucesso!");
          // Notifica o componente pai que dados foram alterados
          onDataChange?.();
        } catch (err) {
          console.error("Erro ao remover sala:", err);
          error("Não foi possível remover a sala: " + err.message);
        }
      },
      null,
      "Excluir sala?"
    );
  }

  function limparFormulario() {
    setNome("");
    setCapacidade(30);
    setTipoSala("comum");
    setPiso("térreo");
  }

  const salasFiltradas = salas.filter((sala) =>
    sala.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
    sala.piso.toLowerCase().includes(pesquisa.toLowerCase()) ||
    sala.tipoSala.toLowerCase().includes(pesquisa.toLowerCase())
  );

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

          {/* Barra de pesquisa */}
          {salas.length > 0 && (
            <div className="search-box">
              <input
                type="text"
                placeholder="Pesquisar salas..."
                value={pesquisa}
                onChange={(e) => setPesquisa(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* Lista */}
          {carregando ? (
            <p className="lista-feedback">Carregando salas...</p>
          ) : salas.length === 0 ? (
            <p className="lista-feedback">Nenhuma sala cadastrada.</p>
          ) : salasFiltradas.length === 0 ? (
            <p className="lista-feedback">Nenhuma sala encontrada.</p>
          ) : (
            <ul className="lista-salas">
              {salasFiltradas.map((sala) => (
                <li key={sala.id} className="item-sala">
                  <div className="item-info">
                    <span className="item-nome">{sala.nome}</span>
                    <div className="item-meta">
                      <span className="pill capacidade">{sala.capacidade} lugares</span>
                      <span className="pill piso">piso: {sala.piso}</span>
                      <span className={`tag ${sala.tipoSala}`}>
                        {sala.tipoSala}
                      </span>
                    </div>
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => removerSala(sala.id)}
                  >
                    Excluir
                  </button>
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
