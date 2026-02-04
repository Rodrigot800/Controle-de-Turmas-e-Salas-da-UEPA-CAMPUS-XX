import React from 'react'   
import { useState } from "react"
import './App.css'
import Header from './components/header'
import { salas } from "./data/sala";
import { GradeSalas } from './components/Grades'

function App() {
  const [turnoSelecionado,setTurnoSelecionado] = useState('manha')
  const turnos = ["Manhã", "Tarde", "Noite"]

  const [ocupacoes, setOcupacoes] = useState([
    {
      salaId: 1,
      turno: "manha",
      turma: "EAS 2024"
    },
    {
      salaId: 2,
      turno: "tarde",
      turma: "EAS 2023"
    },
    {
      salaId: 3,
      turno: "noite",
      turma: "EAS 2022"
    }
  ]);
 
  console.log(salas);

  return (
    <>
      <div>
        <Header
          title="Controle de Salas e Turmas – UEPA"
          subtitle="Sistema acadêmico de organização de salas"
        />
        <div className="filtros-turno">
          <button onClick={() => setTurnoSelecionado("manha")}>
            Manhã
          </button>

          <button onClick={() => setTurnoSelecionado("tarde")}>
            Tarde
          </button>

          <button onClick={() => setTurnoSelecionado("noite")}>
            Noite
          </button>
        </div>

        <div><GradeSalas
          salas={salas}
          ocupacoes={ocupacoes}
          turno={turnoSelecionado}
        />
        </div>
      </div>
      
      
    </>
  )
}

export default App
