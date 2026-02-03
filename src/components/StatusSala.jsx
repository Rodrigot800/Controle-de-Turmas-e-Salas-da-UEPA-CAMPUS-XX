import { useState } from "react"

function StatusSala() {
    const [status, setStatus] = useState("livre")

    return (
        <div className="status-sala">
            <p>Status da sala: <strong className={status === "livre" ? "livre" : "ocupada"}>{status}</strong></p>

            <button onClick={() => setStatus("livre")}>
                Livre
            </button>

            <button onClick={() => setStatus("ocupada")}>
                Ocupada
            </button>
        </div>
    )
}

export default StatusSala
