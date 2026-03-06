import { useState } from "react";
import "./modalTurmas.css";

export default function ModalTurmas({ turmas, setTurmas, cursos, onClose }) {
    const [nome, setNome] = useState("");
    const [cursoId, setCursoId] = useState("");
    const [turno, setTurno] = useState("");
    const [semestre, setSemestre] = useState(1);
    const [anoInicio, setAnoInicio] = useState(new Date().getFullYear());

    function gerarProximoId(lista) {
        if (lista.length === 0) return 1;

        const maiorId = Math.max(...lista.map(item => item.id));
        return maiorId + 1;
    }

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
        if (!semestre || (semestre != 2 && semestre != 1)) {
            alert("Por favor, selecione um semestre válido (1° ou 2°).");
            return false;
        }
        if (!anoInicio || Number(anoInicio) < 2000 || Number(anoInicio) > new Date().getFullYear() + 5) {
            alert("Por favor, insira um ano de início válido.");
            return false;
        }
        return true;
    }

    function adicionarTurma() {
        if (!validarEntrada()) return;

        if (turmas.some(t =>
            t.nome.trim().toLowerCase() === nome.trim().toLowerCase() &&
            t.anoInicio == anoInicio 
        )) {
            alert("Já existe uma turma com esse nome. Por favor, escolha outro nome.");
            return;
        }

        const novaTurma = {
            id: gerarProximoId(turmas),
            nome,
            cursoId: Number(cursoId),
            semestre: Number(semestre),
            anoInicio: Number(anoInicio),
            turno: turno
        };

        setTurmas((prev) => [...prev, novaTurma]);

        setNome("");
        setCursoId("");
    }
    console.log(turmas);
    function removerTurma(id) {
        if (!window.confirm("Deseja excluir esta turma?")) return;
        setTurmas(turmas.filter((t) => t.id !== id));
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
                            <option value="">Selecione um curso</option>

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
                        <select value={semestre} onChange={(e) => setSemestre(e.target.value)}>
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
                                {turma.nome} {turma.anoInicio} — {turma.turno} —  {turma.semestre}º — {nomeCurso(turma.cursoId)}
                            </span>
                            <button className="btn-delete" onClick={() => removerTurma(turma.id)}>
                                X
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}
