import { useState } from "react";
import "./modalSalas.css";

export default function ModalSalas({ salas, setSalas, onClose }) {
    const [nome, setNome] = useState("");
    const [tipo, setTipo] = useState("comum");
    const [capacidade, setCapacidade] = useState("");
    const [piso, setPiso] = useState("");

    function gerarProximoId(lista) {
        if (lista.length === 0) return 1;

        const maiorId = Math.max(...lista.map(item => item.id));
        return maiorId + 1;
    }

    function adicionarSala() {
        if (!nome) return;

        const novaSala = {
            id: gerarProximoId(salas),
            nome,
            tipo,
            capacidade,
            piso,
        };

        setSalas((salasAtuais) => {
            const atualizadas = [...salasAtuais, novaSala];
            console.log("SALAS APÓS ADICIONAR:", atualizadas);
            return atualizadas;
        });

        setNome("");
        setCapacidade("");
        setPiso("");
        setTipo("comum");
    }

    function removerSala(id) {
        const confirmar = window.confirm("Tem certeza que deseja excluir esta sala?");
        if (!confirmar) return;

        const novasSalas = salas.filter((sala) => sala.id !== id);
        setSalas(novasSalas);

        console.log("SALAS APÓS EXCLUSÃO:", novasSalas);
    }

    return (
        <div className="modal-backdrop">
            

            <div className="modal">
                <button className="btn-close-icon" onClick={onClose}>×</button>

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
                            />
                        </div>

                        <div className="form-group">
                            <label>Piso</label>
                            <input
                                type="text"
                                value={piso}
                                onChange={(e) => setPiso(e.target.value)}
                                placeholder="1º andar"
                            />
                        </div>

                        <div className="form-group">
                            <label>Tipo da sala</label>
                            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
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
                                {sala.nome} | Cap: {sala.capacidade} | Piso: {sala.piso} | {sala.tipo}
                            </span>

                            <button
                                className="btn-delete"
                                onClick={() => removerSala(sala.id)}
                                title="Excluir sala"
                            >
                                
                                 <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" /></svg>
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}
