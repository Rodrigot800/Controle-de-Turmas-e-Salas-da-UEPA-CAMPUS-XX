import "./Grades.css";

export function GradeSalas({ salas, ocupacoes, onCellClick }) {
 
    function getStatusClass(valor) {
        return valor === "livre" ? "livre" : "ocupado";
    }

    function getSalaClass(tipo) {
        if (tipo === "informatica") return "sala-info";
        if (tipo === "laboratorio") return "sala-lab";
        return "sala-comum";
    }

    function getOcupacaoSala(salaId, turno) {
        return ocupacoes.find(
            (o) => o.salaId === salaId && o.turno === turno
        );
    }

    return (
        <div className="grade">
            {/* Cabeçalho */}
            <div className="grade-header">
                <span>Sala</span>
                <span>Manhã</span>
                <span>Tarde</span>
                <span>Noite</span>
            </div>

            {/* Linhas */}
            {salas.map((sala) => {
                const manha = getOcupacaoSala(sala.id, salas.ocupacoes);
                const tarde = getOcupacaoSala(sala.id, "tarde");
                const noite = getOcupacaoSala(sala.id, "noite");

                return (
                    <div
                        key={sala.id}
                        className={`grade-row ${getSalaClass(sala.tipo)}`}
                    >
                        <span className="sala-nome">{sala.nome}</span>

                        <span
                            onClick={() => onCellClick(sala.id, "manha")}
                            className={getStatusClass(manha ? "ocupado" : "livre")}
                        >
                            {manha ? manha.turma : "Livre"}
                        </span>


                        <span
                            onClick={() => onCellClick(sala.id, "tarde")}
                            className={getStatusClass(tarde ? "ocupado" : "livre")}
                        >
                            {tarde ? tarde.turma : "Livre"}
                        </span>


                        <span
                            onClick={() => onCellClick(sala.id, "noite")}
                            className={getStatusClass(noite ? "ocupado" : "livre")}
                        >
                            {noite ? noite.turma : "Livre"}
                        </span>

                        
                    </div>
                );
            })}
        </div>
    );
}
