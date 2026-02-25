export default function TabelaAlocacoes({ salas = [], turmas = [], alocacoes = [] }) {

    function turmaPorSalaETurno(salaId, turno) {
        const alocacao = alocacoes.find(
            a =>
                Number(a.salaId) === Number(salaId) &&
                a.turno === turno
        );

        if (!alocacao) return null;

        return turmas.find(t => Number(t.id) === Number(alocacao.turmaId)) || null;
    }

    if (!salas.length) {
        return <p>Nenhuma sala cadastrada.</p>;
    }

    return (
        <table style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr>
                    <th style={th}>Sala</th>
                    <th style={th}>Manhã</th>
                    <th style={th}>Tarde</th>
                    <th style={th}>Noite</th>
                </tr>
            </thead>

            <tbody>
                {salas.map(sala => {
                    const turmaManha = turmaPorSalaETurno(sala.id, "Manhã");
                    const turmaTarde = turmaPorSalaETurno(sala.id, "Tarde");
                    const turmaNoite = turmaPorSalaETurno(sala.id, "Noite");

                    return (
                        <tr key={sala.id}>
                            <td style={td}>{sala.nome}</td>

                            <td style={td}>
                                {turmaManha
                                    ? `${turmaManha.nome} (${turmaManha.anoInicio})`
                                    : "Livre"}
                            </td>

                            <td style={td}>
                                {turmaTarde
                                    ? `${turmaTarde.nome} (${turmaTarde.anoInicio})`
                                    : "Livre"}
                            </td>

                            <td style={td}>
                                {turmaNoite
                                    ? `${turmaNoite.nome} (${turmaNoite.anoInicio})`
                                    : "Livre"}
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

const th = {
    border: "1px solid #ccc",
    padding: "8px",
    background: "#f5f5f5",
};

const td = {
    border: "1px solid #ccc",
    padding: "8px",
};