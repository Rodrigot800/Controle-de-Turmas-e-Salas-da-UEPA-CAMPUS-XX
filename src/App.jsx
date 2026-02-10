
import { useState } from "react";
import Header from "./components/header";
import { GradeSalas } from "./components/Grades";
import { salas } from "./data/salas";
import { ocupacoes } from "./data/ocupacoes";



function App() {
  const [celulaSelecionada, setCelulaSelecionada] = useState(null);

  function handleCellClick(salaId, turno, ocupacao) {
    setCelulaSelecionada({
      salaId,
      turno,
      ocupacao,
    });
  }

  function fecharModal() {
    setCelulaSelecionada(null);
  }

  return (
    <>
      <GradeSalas
        salas={salas}
        ocupacoes={ocupacoes}
        onCellClick={handleCellClick}
      />

      {celulaSelecionada && (
        <div className="modal-backdrop" onClick={fecharModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              Sala {celulaSelecionada.salaId} – {celulaSelecionada.turno}
            </h2>

            {celulaSelecionada.ocupacao ? (
              <p>Turma: {celulaSelecionada.ocupacao.turma}</p>
            ) : (
              <p>Horário livre</p>
            )}

            <button onClick={fecharModal}>Fechar</button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;


// function App() {


//   const [celulaSelecionada, setCelulaSelecionada] = useState(null);
//   function handleCellClick(salaId, turno, ocupacao) {
//     setCelulaSelecionada({
//       salaId,
//       turno,
//       ocupacao,
//     });
//   }

//   const [turnoSelecionado,setTurnoSelecionado] = useState('manha')
//   const turnos = ["Manhã", "Tarde", "Noite"]

//   const [ocupacoes, setOcupacoes] = useState([
//     {
//       salaId: 1,
//       turno: "manha",
//       turma: "EAS 2024"
//     },
//     {
//       salaId: 2,
//       turno: "tarde",
//       turma: "EAS 2023"
//     },
//     {
//       salaId: 3,
//       turno: "noite",
//       turma: "EAS 2022"
//     }
//   ]);
 
//   console.log(salas);

//   return (
//     <>
//       <div>
//         <Header
//           title="Controle de Salas e Turmas – UEPA"
//           subtitle="Sistema acadêmico de organização de salas"
//         />
//         <div className="filtros-turno">
//           <button onClick={() => setTurnoSelecionado("manha")}>
//             Manhã
//           </button>

//           <button onClick={() => setTurnoSelecionado("tarde")}>
//             Tarde
//           </button>

//           <button onClick={() => setTurnoSelecionado("noite")}>
//             Noite
//           </button>
//         </div>

//         <div><GradeSalas
//           salas={salas}
//           ocupacoes={ocupacoes}
//           turno={turnoSelecionado}
//           onCellClick={handleCellClick}
//         />
//           {celulaSelecionada && (
//             <div className="debug">
//               <p>Sala ID: {celulaSelecionada.salaId}</p>
//               <p>Turno: {celulaSelecionada.turno}</p>
//               <p>
//                 Status:{" "}
//                 {celulaSelecionada.ocupacao
//                   ? "Ocupada"
//                   : "Livre"}
//               </p>
//             </div>
//           )}

//         </div>
//       </div>
      
      
//     </>
//   )
// }

// export default App
