import { useState, useEffect } from "react";
import "../style/calendario.css";

const diasDaSemanaMap = {
  "Domingo": 0,
  "Segunda-feira": 1,
  "Terça-feira": 2,
  "Quarta-feira": 3,
  "Quinta-feira": 4,
  "Sexta-feira": 5,
  "Sábado": 6
};

const nomesMeses = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function CalendarioAlocacoes({ alocacoesDisciplinas, salas }) {
  const dataHoje = new Date();
  const [mesAtual, setMesAtual] = useState(dataHoje.getMonth());
  const [anoAtual, setAnoAtual] = useState(dataHoje.getFullYear());

  const mudarMes = (delta) => {
    let novoMes = mesAtual + delta;
    let novoAno = anoAtual;
    if (novoMes > 11) {
      novoMes = 0;
      novoAno++;
    } else if (novoMes < 0) {
      novoMes = 11;
      novoAno--;
    }
    setMesAtual(novoMes);
    setAnoAtual(novoAno);
  };

  const voltarParaHoje = () => {
    setMesAtual(dataHoje.getMonth());
    setAnoAtual(dataHoje.getFullYear());
  };

  // Gerar grade do calendário
  const primeiroDiaDoMes = new Date(anoAtual, mesAtual, 1).getDay();
  const totalDiasDoMes = new Date(anoAtual, mesAtual + 1, 0).getDate();

  const dias = [];
  // Preencher dias vazios antes do dia 1
  for (let i = 0; i < primeiroDiaDoMes; i++) {
    dias.push(null);
  }
  // Preencher dias do mês
  for (let i = 1; i <= totalDiasDoMes; i++) {
    dias.push(i);
  }

  // Filtrar alocações para uma data específica
  const getAlocacoesDoDia = (dia, mes, ano) => {
    if (!dia) return [];
    
    const dataVerificar = new Date(ano, mes, dia);
    // Zerar horas para comparar apenas datas
    dataVerificar.setHours(0, 0, 0, 0);
    const diaDaSemanaIdx = dataVerificar.getDay();

    return alocacoesDisciplinas.filter(aloc => {
      // 1. Verifica dia da semana
      const alocDiaIdx = diasDaSemanaMap[aloc.dia_semana];
      if (alocDiaIdx !== diaDaSemanaIdx) return false;

      // 2. Verifica intervalo (se houver)
      if (aloc.data_inicio && aloc.data_fim) {
        // Parse da data ISO (yyyy-mm-dd) mas corrigindo timezone ou usando valores brutos
        const [anoIni, mesIni, diaIni] = aloc.data_inicio.split('T')[0].split('-');
        const [anoFim, mesFim, diaFim] = aloc.data_fim.split('T')[0].split('-');
        
        const dtInicio = new Date(Number(anoIni), Number(mesIni) - 1, Number(diaIni));
        const dtFim = new Date(Number(anoFim), Number(mesFim) - 1, Number(diaFim));
        
        dtInicio.setHours(0, 0, 0, 0);
        dtFim.setHours(23, 59, 59, 999);

        if (dataVerificar < dtInicio || dataVerificar > dtFim) {
          return false;
        }
      }

      return true;
    });
  };

  const isHoje = (dia, mes, ano) => {
    return dia === dataHoje.getDate() && mes === dataHoje.getMonth() && ano === dataHoje.getFullYear();
  };

  return (
    <div className="calendario-container">
      <div className="calendario-header">
        <h2>{nomesMeses[mesAtual]} {anoAtual}</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="calendario-nav-btn" onClick={() => mudarMes(-1)}>Anterior</button>
          <button className="calendario-nav-btn" onClick={voltarParaHoje}>Hoje</button>
          <button className="calendario-nav-btn" onClick={() => mudarMes(1)}>Próximo</button>
        </div>
      </div>

      <div className="calendario-grid">
        <div className="calendario-dias-semana">
          <div className="dia-semana-header">Dom</div>
          <div className="dia-semana-header">Seg</div>
          <div className="dia-semana-header">Ter</div>
          <div className="dia-semana-header">Qua</div>
          <div className="dia-semana-header">Qui</div>
          <div className="dia-semana-header">Sex</div>
          <div className="dia-semana-header">Sáb</div>
        </div>

        {dias.map((dia, index) => {
          if (dia === null) {
            return <div key={`vazio-${index}`} className="calendario-celula dia-vazio"></div>;
          }

          const alocacoesNoDia = getAlocacoesDoDia(dia, mesAtual, anoAtual);
          const hojeClasse = isHoje(dia, mesAtual, anoAtual) ? "dia-atual" : "";

          return (
            <div key={`dia-${dia}`} className={`calendario-celula ${hojeClasse}`}>
              <div className="dia-numero">{dia}</div>
              <div className="alocacoes-lista">
                {alocacoesNoDia.map(aloc => (
                  <div 
                    key={`${aloc.id}-${dia}`} 
                    className={`alocacao-chip ${aloc.is_modular ? 'modular' : ''}`}
                    title={`${aloc.disciplina_nome} - Prof: ${aloc.professor_nome || 'N/A'}`}
                  >
                    <strong>{aloc.turma_nome}</strong>
                    <span className="sala-info">{aloc.sala_nome}</span>
                    <div style={{ marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {aloc.disciplina_nome}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
