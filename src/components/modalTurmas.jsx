import { useState } from "react";
import "./modalTurmas.css";

export default function ModalTurmas({ turmas, setTurmas, cursos, onClose }) {
    const [nome, setNome] = useState("");
    const [cursoId, setCursoId] = useState("");
    const [semestre, setSemestre] = useState(1);
    const [anoInicio, setAnoInicio] = useState(new Date().getFullYear());

    function adicionarTurma() {
        if (!nome || !cursoId) return;

        const novaTurma = {
            id: Date.now(),
            nome,
            cursoId: Number(cursoId),
            semestre: Number(semestre),
            anoDeinicio: Number(anoInicio),
        };

        setTurmas((prev) => [...prev, novaTurma]);

        setNome("");
        setCursoId("");
    }

    function removerTurma(id) {
        if (!window.confirm("Deseja excluir esta turma?")) return;
        setTurmas(turmas.filter((t) => t.id !== id));
    }

    function nomeCurso(cursoId) {
        const curso = cursos.find((c) => c.id === cursoId);
        return curso ? curso.nome : "Curso não encontrado";
    }

    return (
        <div className="modal-backdrop">
            <div className="modal">

                <button className="btn-close" onClick={onClose}>✕</button>

                <h2>Gerenciar Turmas</h2>

                <div className="form-grid">
                    <div>
                        <label>Nome da Turma</label>
                        <input value={nome} onChange={(e) => setNome(e.target.value)} />
                    </div>

                    <div>
                        <label>Curso</label>
                        <select value={cursoId} onChange={(e) => setCursoId(e.target.value)}>
                            <option value="">Selecione</option>

                            {cursos.map((curso) => (
                                <option key={curso.id} value={curso.id}>
                                    {curso.nome}
                                </option>
                            ))}
                        </select>

                    </div>

                    <div>
                        <label>Semestre</label>
                        <input
                            type="number"
                            value={semestre}
                            onChange={(e) => setSemestre(e.target.value)}
                        />
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
                                {turma.nome} — {nomeCurso(turma.cursoId)} — {turma.semestre}º
                            </span>
                            <button className="btn-delete" onClick={() => removerTurma(turma.id)}>
                                🗑
                            </button>
                        </li>
                    ))}
                </ul>

            </div>
        </div>
    );
}
