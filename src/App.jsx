import React from 'react'   
import { useState } from "react"
import './App.css'
import Header from './components/header'
import SlotCell from './components/SlotCell'

function App() {
  const turnos = ["Manhã", "Tarde", "Noite"]
  const [status, setStatus] = useState({
    Manhã: false,
    Tarde: false,
    Noite: false,
  })
  function toggleStatus(turno) {
    setStatus(prev => ({
      ...prev,
      [turno]: !prev[turno],
    }))
  }

  return (
    <>
      <div>
        <Header
          title="Controle de Salas e Turmas – UEPA"
          subtitle="Sistema acadêmico de organização de salas"
        />

        <div className="grid">
          {turnos.map(turno => (
            <button
              key={turno}
              onClick={() => toggleStatus(turno)}
              className={status[turno] ? "ocupado" : "livre"}
            >
              {turno}
            </button>
          ))}
        </div>
      </div>
      
      
    </>
  )
}

export default App
