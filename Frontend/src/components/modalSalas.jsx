import { useState } from "react";
import "./modalSalas.css";

export default function ModalSalas({ salas, setSalas, onClose }) {
    const [nome, setNome] = useState("");
    const [tipo, setTipo] = useState("comum");
    const [capacidade, setCapacidade] = useState("30");
    const [piso, setPiso] = useState("térreo");

    function gerarProximoId(lista) {
        if (lista.length === 0) return 1;

        const maiorId = Math.max(...lista.map(item => item.id));
        return maiorId + 1;
    }

    function validarEntrada() {
        if (nome.trim() === "" || nome.length < 2) {
            alert("Por favor, insira um nome válido para a sala.");
            return false;
        }

        if (capacidade <= 0 || Number(capacidade) === false) {
            alert("Por favor, insira uma capacidade válida.");
            return false;
        }

        if (piso.trim() === "" ) {
            alert("Por favor, insira o piso da sala.");
            return false;
        }

        return true;
    }


    function adicionarSala() {
        if (!validarEntrada()) return;
        if (nome.trim() === "") {
            alert("O nome da sala é obrigatório.");
            return;
        } 

        const salaExiste = salas.some(
            sala => sala.nome.toLowerCase() === nome.trim().toLowerCase()
        );

        if (salaExiste) {
            alert("Já existe uma sala com esse nome. Por favor, escolha outro nome.");
            return;
        }

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
                                step= "10"
                            />
                        </div>

                        <div className="form-group">
                            <label>Piso</label>
                            <select name="piso" id="piso" value={piso} onChange={(e) => setPiso(e.target.value)}>
                                <option value="térreo">Térreo</option>
                                <option value="1º andar">1º andar</option>
                                <option value="2º andar">2º andar</option>
                                
                            </select>
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
                                X
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}
