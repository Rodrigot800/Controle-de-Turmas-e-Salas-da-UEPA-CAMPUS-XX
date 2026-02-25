import { useState } from "react";
import "./modalCursos.css";

export default function ModalCursos({ cursos, setCursos, onClose }) {
    const [nomeCurso, setNomeCurso] = useState("");
    const [vagas, setVagas] = useState("");
    const [semestres, setSemestres] = useState("");

    function gerarProximoId(lista) {
        if (lista.length === 0) return 1;

        const maiorId = Math.max(...lista.map(item => item.id_curso));
        return maiorId + 1;
    }

    function adicionarCurso() {
        if (!nomeCurso || !vagas || !semestres) return;

        const novoCurso = {
            id_curso: gerarProximoId(cursos),
            nome_curso: nomeCurso,
            vagas: Number(vagas),
            semestres: Number(semestres),
        };

        setCursos((atuais) => {
            const atualizados = [...atuais, novoCurso];
            console.log("CURSOS APÓS ADICIONAR:", atualizados);
            return atualizados;
        });

        setNomeCurso("");
        setVagas("");
        setSemestres("");
    }

    function removerCurso(id) {
        const confirma = window.confirm("Deseja excluir este curso?");
        if (!confirma) return;

        setCursos(cursos.filter((c) => c.id_curso !== id));
    }

    return (
        <div className="modal-backdrop">
            <div className="modal">
                <button className="btn-close" onClick={onClose}>×</button>

                <h2>Gerenciar Cursos</h2>

                <div className="form-grid">
                    <div className="form-group">
                        <label>Nome do curso</label>
                        <input
                            value={nomeCurso}
                            onChange={(e) => setNomeCurso(e.target.value)}
                            placeholder="Ex: Engenharia Ambiental"
                        />
                    </div>

                    <div className="form-group">
                        <label>Vagas</label>
                        <input
                            type="number"
                            value={vagas}
                            onChange={(e) => setVagas(e.target.value)}
                            placeholder="40"
                        />
                    </div>

                    <div className="form-group">
                        <label>Semestres</label>
                        <input
                            type="number"
                            value={semestres}
                            onChange={(e) => setSemestres(e.target.value)}
                            placeholder="10"
                        />
                    </div>
                </div>

                <button className="btn-primary" onClick={adicionarCurso}>
                    Adicionar Curso
                </button>

                <ul className="lista-salas">
                    {cursos.map((curso) => (
                        <li key={curso.id_curso} className="linha-sala">
                            <span>
                                {curso.nome_curso} — {curso.vagas} vagas — {curso.semestres} semestres
                            </span>

                            <button
                                className="btn-delete"
                                onClick={() => removerCurso(curso.id_curso)}
                                title="Excluir"
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
