import { useState } from "react";
import "./modalAlocacao.css";

export default function ModalAlocacoes({
    turmas,
    salas,
    alocacoes,
    setAlocacoes,
    onClose
}) {

    const [timeAlocacao, setTimeAlocacao] = useState("definitivo");
    var anoAtual = new Date().getFullYear();
    const [anoTemp, setAnoTemp] = useState(anoAtual);
    var semestreAtual = new Date().getMonth() < 6 ? 1 : 2
    const [semestreTemp, setSemestreTemp] = useState(semestreAtual);

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

    function adicionarAlocacao() {
        if (!validarEntrada()) return;
        
        const alocacaoExiste = alocacoes.some(a => {

            if (
                a.salaId != Number(salaId) ||
                a.turno != turno
            ) return false;

            // se alguma for definitiva já bloqueia
            if (a.timeAlocacao === "definitivo") return true;

            // se ambas temporárias, verifica semestre
            if (timeAlocacao === "temporario" && a.timeAlocacao === "temporario") {
                return (
                    a.anoAlocacaoTemp == anoTemp &&
                    a.semestreAlocacaoTemp == semestreTemp
                );
            }

            return false;
        });

        if (alocacaoExiste) {
            alert("Já existe uma alocação para esta sala e turno. Por favor, escolha outra sala ou turno.");
            return;
        }
        const nova = {
            id: gerarProximoId(alocacoes),
            turmaId: Number(turmaId),
            salaId: Number(salaId),
            turno,
            timeAlocacao,
            anoAlocacaoTemp: timeAlocacao === "temporario" ? Number(anoTemp) : null,
            semestreAlocacaoTemp: timeAlocacao === "temporario" ? Number(semestreTemp) : null
        };

        setAlocacoes(prev => [...prev, nova]);

        setTurmaId("");
        setSalaId("");
        setTurno("");
        setTimeAlocacao("definitivo");
        setAnoTemp(anoAtual);
        setSemestreTemp(semestreAtual);
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
                    <div>
                        <label>Tipo de Alocação</label>
                        <select
                            value={timeAlocacao}
                            onChange={e => setTimeAlocacao(e.target.value)}
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
                                    onChange={e => setAnoTemp(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Semestre</label>
                                <select
                                    value={semestreTemp}
                                    onChange={e => setSemestreTemp(e.target.value)}
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
                    {alocacoes.map(a => (
                        <li key={a.id} className="linha-sala">
                            <span>
                                {nomeTurma(a.turmaId)}
                                ({turmas.find(t => t.id === a.turmaId)?.anoInicio || 'N/A'})
                                {" — "}
                                {nomeSala(a.salaId)}
                                {" — "}
                                {a.turno}

                                {a.timeAlocacao === "temporario" && (
                                    <span style={{ marginLeft: 8, color: "#666" }}>
                                        [{a.anoAlocacaoTemp}.{a.semestreAlocacaoTemp}]
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