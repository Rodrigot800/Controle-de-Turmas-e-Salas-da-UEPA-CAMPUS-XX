import { useState } from "react";
import "./modalSalas.css";

export default function ModalSalas({ salas, setSalas, onClose }) {
    const [nome, setNome] = useState("");
    const [tipo, setTipo] = useState("comum");
    const [capacidade, setCapacidade] = useState("30")
    const [piso, setPiso] = useState("")

    function adicionarSala() {
        if (!nome) return;

        const novaSala = {
            id: Date.now(),
            nome,
            tipo,
            capacidade,
            piso
        };

        setSalas((salasAtuais) => {
            const atualizadas = [...salasAtuais, novaSala]
            console.log("SALAS APÓS Adicionar: ", atualizadas);
            return atualizadas;
        });
        setNome("");
    }

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <h2>Gerenciar Salas</h2>
                <div className="form-row">
                    <input
                        placeholder="Nome da sala"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                    />

                    <input
                        placeholder="Capacidade da sala"
                        value={capacidade}
                        onChange={(e) => setCapacidade(e.target.value)}
                        type="number"
                    ></input>

                    <input
                        placeholder="piso da sala"
                        value={piso}
                        onChange={(e) => setPiso(e.target.value)}
                    ></input>

                    <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
                        <option value="comum">Comum</option>
                        <option value="laboratorio">Laboratório</option>
                        <option value="informatica">Informática</option>
                    </select>

                </div>
                
                <button onClick={adicionarSala}>Adicionar</button>

                <ul>
                    {salas.map((sala) => (
                        <li key={sala.id}>
                            {sala.nome} - Capacidade: {sala.capacidade} -Andar°: {sala.piso}-  ({sala.tipo} )
                        </li>
                    ))}
                </ul>

                <button onClick={onClose}>Fechar</button>
            </div>
        </div>
    );
}
