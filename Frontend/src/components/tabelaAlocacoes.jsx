import { useState,useEffect } from "react";
import API_BASE from "../config/api";

export default function TabelaAlocacoes() {

    const [salas, setSalas] = useState([]);
    const [turmas, setTurmas] = useState([]);
    const [cursos, setCursos] = useState([]);
    const [alocacoes, setAlocacoes] = useState([]);

    useEffect(() => {
        carregarDados();
    }, []);
    
    async function carregarDados() {
    try {
        const [salasRes, turmasRes, cursosRes, alocacoesRes] = await Promise.all([
            fetch(`${API_BASE}/salas`),
            fetch(`${API_BASE}/turmas`),
            fetch(`${API_BASE}/cursos`),
            fetch(`${API_BASE}/alocacoes`)
        ]);

        const salasData = await salasRes.json();
        const turmasData = await turmasRes.json();
        const cursosData = await cursosRes.json();
        const alocacoesData = await alocacoesRes.json();

        console.log("Salas:", salasData);
        console.log("Turmas:", turmasData);
        console.log("Cursos:", cursosData);
        console.log("Alocações:", alocacoesData);

        setSalas(salasData);
        setTurmas(turmasData);
        setCursos(cursosData);
        setAlocacoes(alocacoesData);

    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

    const [anoSelecionado, setAnoSelecionado] = useState(2026);
    const [semestreSelecionado, setSemestreSelecionado] = useState(1);

    function semestreAbsoluto(ano, semestre) {
        return Number(ano) * 2 + (Number(semestre) === 2 ? 1 : 0);
    }

    function turmaEstaAtiva(turma) {

    const curso = cursos.find(
        c => Number(c.id) === Number(turma.curso_id)
    );

    if (!curso) return false;

    const inicio = semestreAbsoluto(
        turma.ano_inicio,
        turma.semestre_inicio
    );

    const fim = inicio + Number(curso.semestres) - 1;

    const atual = semestreAbsoluto(
        anoSelecionado,
        semestreSelecionado
    );

    return atual >= inicio && atual <= fim;
}

   function turmaPorSalaETurno(salaId, turno) {

    const alocacoesFiltradas = alocacoes.filter(a =>
        Number(a.sala_id) === Number(salaId) &&
        a.turno?.toLowerCase() === turno.toLowerCase()
    );

    // prioridade 1: temporário
    let alocacao = alocacoesFiltradas.find(a =>
        a.time_alocacao === "temporario" &&
        Number(a.ano_temp) === Number(anoSelecionado) &&
        Number(a.semestre_temp) === Number(semestreSelecionado)
    );

    // prioridade 2: definitivo
    if (!alocacao) {
        alocacao = alocacoesFiltradas.find(
            a => a.time_alocacao === "definitivo"
        );
    }

    if (!alocacao) return null;

    const turma = turmas.find(
        t => Number(t.id) === Number(alocacao.turma_id)
    );
    console.log("Turma encontrada:", turma, "Ativa:", turmaEstaAtiva(turma));
    if (!turma) return null;

    return turmaEstaAtiva(turma) ? turma : null;
    }
    

   return (
    <div className="container mt-4">

        {/* FILTROS */}
        <div className="d-flex justify-content-end gap-2 mb-3">

            <select
                className="form-select w-auto"
                value={anoSelecionado}
                onChange={e => setAnoSelecionado(e.target.value)}
            >
                {[2021,2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031].map(ano => (
                    <option key={ano} value={ano}>
                        {ano}
                    </option>
                ))}
            </select>

            <select
                className="form-select w-auto"
                value={semestreSelecionado}
                onChange={e => setSemestreSelecionado(e.target.value)}
            >
                <option value={1}>1º Semestre</option>
                <option value={2}>2º Semestre</option>
            </select>

        </div>

        {/* TABELA */}
        <div className="table-responsive">

            <table className="table table-striped table-hover table-bordered align-middle text-center">

                <thead className="table-dark">
                    <tr>
                        <th>Sala</th>
                        <th>Manhã</th>
                        <th>Tarde</th>
                        <th>Noite</th>
                    </tr>
                </thead>

                <tbody>

                    {salas.map(sala => {

                        const turmaManha = turmaPorSalaETurno(sala.id, "manhã");
                        const turmaTarde = turmaPorSalaETurno(sala.id, "tarde");
                        const turmaNoite = turmaPorSalaETurno(sala.id, "noite");

                        return (
                            <tr key={sala.id}>

                                <td className="fw-bold">
                                    {sala.nome}
                                </td>

                                <td>
                                    {turmaManha
                                        ? (
                                            <span className="text-primary fw-semibold">
                                                {turmaManha.nome}  ({turmaManha.ano_inicio}.{turmaManha.semestre_inicio})
                                            </span>
                                        )
                                        : (
                                            <span className="text-success fw-semibold">
                                                Livre
                                            </span>
                                        )}
                                </td>

                                <td>
                                    {turmaTarde
                                        ? (
                                            <span className="text-primary fw-semibold">
                                                {turmaTarde.nome}  ({turmaTarde.ano_inicio}.{turmaTarde.semestre_inicio})
                                            </span>
                                        )
                                        : (
                                            <span className="text-success fw-semibold">
                                                Livre
                                            </span>
                                        )}
                                </td>

                                <td>
                                    {turmaNoite
                                        ? (
                                            <span className="text-primary fw-semibold">
                                                {turmaNoite.nome} ({turmaNoite.ano_inicio}.{turmaNoite.semestre_inicio})
                                            </span>
                                        )
                                        : (
                                            <span className="text-success fw-semibold">
                                                Livre
                                            </span>
                                        )}
                                </td>

                            </tr>
                        );
                    })}

                </tbody>

            </table>

        </div>

    </div>
);
}

const th = {
    border: "1px solid #ccc",
    padding: "8px",
    background: "#f5f5f5"
};

const td = {
    border: "1px solid #ccc",
    padding: "8px"
};