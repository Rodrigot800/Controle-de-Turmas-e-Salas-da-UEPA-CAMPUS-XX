// Frontend/src/components/modalConflitoAlocacao.jsx
import { useEffect, useState } from "react";
import "../style/modal.shared.css";
import "../style/modalConflitoAlocacao.css";

export default function ModalConflitoAlocacao({ conflitos, onClose, onResolve }) {
  const [conflitoSelecionado, setConflitoSelecionado] = useState(null);

  // Função para verificar se duas alocações têm conflito
  const verificarConflito = (aloc1, aloc2) => {
    return (
      aloc1.sala_id === aloc2.sala_id &&
      aloc1.turno === aloc2.turno &&
      (
        // Conflito entre definitivo e temporário
        (aloc1.time_alocacao === "definitivo" && aloc2.time_alocacao === "temporario") ||
        (aloc1.time_alocacao === "temporario" && aloc2.time_alocacao === "definitivo") ||
        // Conflito entre dois temporários no mesmo período
        (aloc1.time_alocacao === "temporario" && aloc2.time_alocacao === "temporario" &&
         aloc1.ano_temp === aloc2.ano_temp && aloc1.semestre_temp === aloc2.semestre_temp)
      )
    );
  };

  // Função para encontrar a turma de uma alocação
  const getTurmaInfo = (alocacao, turmas) => {
    const turma = turmas.find(t => t.id === alocacao.turma_id);
    return turma ? `${turma.nome} (${turma.ano_inicio}.${turma.semestre_inicio})` : "Turma não encontrada";
  };

  return (
    <div className="modal-overlay">
      <div className="modal-conflito">
        <div className="modal-header">
          <h3>Conflitos de Alocação Detectados</h3>
          <button className="modal-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          {conflitos.length === 0 ? (
            <p className="no-conflicts">Nenhum conflito detectado no momento.</p>
          ) : (
            <>
              <p className="conflict-count">
                {conflitos.length} conflito{conflitos.length > 1 ? "s" : ""} encontrado{conflitos.length > 1 ? "s" : ""}
              </p>

              <div className="conflict-list">
                {conflitos.map((conflito, index) => (
                  <div
                    key={index}
                    className={`conflict-item ${conflitoSelecionado === index ? "selected" : ""}`}
                    onClick={() => setConflitoSelecionado(index)}
                  >
                    <div className="conflict-sala">
                      <strong>Sala:</strong> {conflito.salaNome} | <strong>Turno:</strong> {conflito.turno}
                    </div>
                    <div className="conflict-turmas">
                      <div className="turma-conflito">
                        <span className="turma-name">{conflito.turma1}</span>
                        <span className={`turma-type ${conflito.tipo1}`}>{conflito.tipo1}</span>
                      </div>
                      <span className="vs">VS</span>
                      <div className="turma-conflito">
                        <span className="turma-name">{conflito.turma2}</span>
                        <span className={`turma-type ${conflito.tipo2}`}>{conflito.tipo2}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {conflitoSelecionado !== null && (
                <div className="conflict-details">
                  <h4>Detalhes do Conflito</h4>
                  <div className="detail-grid">
                    <div>
                      <p><strong>Sala:</strong> {conflitos[conflitoSelecionado].salaNome}</p>
                      <p><strong>Turno:</strong> {conflitos[conflitoSelecionado].turno}</p>
                    </div>
                    <div>
                      <p><strong>Tipo de conflito:</strong> {conflitos[conflitoSelecionado].tipoConflito}</p>
                    </div>
                  </div>

                  <div className="resolution-options">
                    <h5>O que deseja fazer?</h5>
                    <div className="buttons-group">
                      <button
                        className="btn-resolve keep-first"
                        onClick={() => onResolve(conflitos[conflitoSelecionado], "keepFirst")}
                      >
                        Manter {conflitos[conflitoSelecionado].turma1}
                      </button>
                      <button
                        className="btn-resolve keep-second"
                        onClick={() => onResolve(conflitos[conflitoSelecionado], "keepSecond")}
                      >
                        Manter {conflitos[conflitoSelecionado].turma2}
                      </button>
                      <button
                        className="btn-resolve manual"
                        onClick={() => onResolve(conflitos[conflitoSelecionado], "manual")}
                      >
                        Resolver Manual
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}