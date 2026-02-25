import { useState } from "react";
import "./modalAlocacao.css";

export default function ModalAlocacoes({
    turmas,
    salas,
    alocacoes,
    setAlocacoes,
    onClose
}) {
    const [turmaId, setTurmaId] = useState("");
    const [salaId, setSalaId] = useState("");
    const [turno, setTurno] = useState("");

    function gerarProximoId(lista) {
        if (lista.length === 0) return 1;
        const maiorId = Math.max(...lista.map(item => item.id));
        return maiorId + 1;
    }

    function selecionarTurma(id) {
        setTurmaId(id);

        const turma = turmas.find(t => t.id === Number(id));
        if (turma) {
            setTurno(turma.turno); // turno vem da turma
        }
    }

    function adicionarAlocacao() {
        if (!turmaId || !salaId || !turno) return;

        const nova = {
            id: gerarProximoId(alocacoes),
            turmaId: Number(turmaId),
            salaId: Number(salaId),
            turno
        };

        setAlocacoes(prev => [...prev, nova]);

        setTurmaId("");
        setSalaId("");
        setTurno("");
    }

    function removerAlocacao(id) {
        if (!window.confirm("Deseja remover esta alocação?")) return;
        setAlocacoes(alocacoes.filter(a => a.id !== id));
    }

    function nomeTurma(id) {
        const t = turmas.find(t => t.id === id);
        return t ? t.nome : "Turma não encontrada";
    }

    function nomeSala(id) {
        const s = salas.find(s => s.id === id);
        return s ? `${s.nome} (${s.tipo})` : "Sala não encontrada";
    }
    console.log("ALOCACOES ATUAIS:", alocacoes);
    return (
        <div className="modal-backdrop">
            <div className="modal">
                <button className="btn-close" onClick={onClose}>×</button>

                <h2>Alocar Turma em Sala</h2>

                <div className="form-grid">
                    <div>
                        <label>Turma</label>
                        <select value={turmaId} onChange={e => selecionarTurma(e.target.value)}>
                            <option value="">Selecione a turma</option>
                            {turmas.map(turma => (
                                <option key={turma.id} value={turma.id}>
                                    {turma.nome} {turma.anoInicio} 
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Sala</label>
                        <select value={salaId} onChange={e => setSalaId(e.target.value)}>
                            <option value="">Selecione a sala</option>
                            {salas.map(sala => (
                                <option key={sala.id} value={sala.id}>
                                    {sala.nome} ({sala.tipo})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label>Turno</label>
                        <select value={turno} onChange={e => setTurno(e.target.value)}>
                            <option value="Manhã">Manhã</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noite">Noite</option>
                        </select>
                    </div>
                </div>

                <button className="btn-primary" onClick={adicionarAlocacao}>
                    Alocar
                </button>

                <ul className="lista-salas">
                    {alocacoes.map(a => (
                        <li key={a.id} className="linha-sala">
                            <span>
                                {nomeTurma(a.turmaId)} {turmas.find(t => t.id === a.turmaId)?.anoInicio || 'N/A'} — {nomeSala(a.salaId)} — {a.turno}
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