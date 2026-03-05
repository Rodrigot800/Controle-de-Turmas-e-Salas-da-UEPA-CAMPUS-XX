import { useState } from "react";

export default function TabelaAlocacoes({
    salas = [],
    turmas = [],
    cursos = [],
    alocacoes = []
}) {

    const [anoSelecionado, setAnoSelecionado] = useState(2024);
    const [semestreSelecionado, setSemestreSelecionado] = useState(1);

    function semestreAbsoluto(ano, semestre) {
        return Number(ano) * 2 + (Number(semestre) === 2 ? 1 : 0);
    }

    function turmaEstaAtiva(turma) {

        const curso = cursos.find(c => Number(c.id_curso) === Number(turma.cursoId));

        if (!curso) return false;

        const inicio = semestreAbsoluto(turma.anoInicio, turma.semestre);
        const fim = inicio + Number(curso.semestres) - 1;

        const atual = semestreAbsoluto(anoSelecionado, semestreSelecionado);

        return atual >= inicio && atual <= fim;
    }

    function turmaPorSalaETurno(salaId, turno) {

        const alocacao = alocacoes.find(
            a =>
                Number(a.salaId) === Number(salaId) &&
                a.turno === turno
        );

        if (!alocacao) return null;

        const turma = turmas.find(
            t => Number(t.id) === Number(alocacao.turmaId)
        );

        if (!turma) return null;

        return turmaEstaAtiva(turma) ? turma : null;
    }

    if (!salas.length) {
        return <p>Nenhuma sala cadastrada.</p>;
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
                    {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031].map(ano => (
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

                            const turmaManha = turmaPorSalaETurno(sala.id, "Manhã");
                            const turmaTarde = turmaPorSalaETurno(sala.id, "Tarde");
                            const turmaNoite = turmaPorSalaETurno(sala.id, "Noite");

                            return (
                                <tr key={sala.id}>

                                    <td className="fw-bold">
                                        {sala.nome}
                                    </td>

                                    <td>
                                        {turmaManha
                                            ? <span className="text-primary fw-semibold">
                                                {turmaManha.nome} ({turmaManha.anoInicio})
                                            </span>
                                            : <span className="text-success fw-semibold">
                                                Livre
                                            </span>}
                                    </td>

                                    <td>
                                        {turmaTarde
                                            ? <span className="text-primary fw-semibold">
                                                {turmaTarde.nome} ({turmaTarde.anoInicio})
                                            </span>
                                            : <span className="text-success fw-semibold">
                                                Livre
                                            </span>}
                                    </td>

                                    <td>
                                        {turmaNoite
                                            ? <span className="text-primary fw-semibold">
                                                {turmaNoite.nome} ({turmaNoite.anoInicio})
                                            </span>
                                            : <span className="text-success fw-semibold">
                                                Livre
                                            </span>}
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