import { useState, useEffect } from "react";
import Header from "./components/header";
import ModalSalas from "./components/modalSalas";
import ModalCursos from "./components/modalCursos";
import ModalTurmas from "./components/modalTurmas";   
import ModalAlocacoes from "./components/modalAlocacao";
import TabelaAlocacoes from "./components/tabelaAlocacoes";

function App() {
  const [modalSalasAberto, setModalSalasAberto] = useState(false);
  const [modalCursosAberto, setModalCursosAberto] = useState(false);
  const [modalTurmasAberto, setModalTurmasAberto] = useState(false);
  const [modalAlocacoesAberto, setModalAlocacoesAberto] = useState(false);

  const [salas, setSalas] = useState(() => {
    const salvo = localStorage.getItem("salas");
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem("salas", JSON.stringify(salas));
  }, [salas]);

  const [cursos, setCursos] = useState(() => {
    const salvo = localStorage.getItem("cursos");
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem("cursos", JSON.stringify(cursos));
  }, [cursos]);

  const [turmas, setTurmas] = useState(() => {
    const salvo = localStorage.getItem("turmas");
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem("turmas", JSON.stringify(turmas));
  }, [turmas]);

  const [alocacoes, setAlocacoes] = useState(() => {
    const salvo = localStorage.getItem("alocacoes");
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem("alocacoes", JSON.stringify(alocacoes));
  }, [alocacoes]);

  return (
    <>
      <Header />

      <button onClick={() => setModalSalasAberto(true)}>
        Gerenciar Salas
      </button>

      <button onClick={() => setModalCursosAberto(true)}>
        Gerenciar Cursos
      </button>
      <button onClick={() => setModalTurmasAberto(true)}>
        Gerenciar Turmas
      </button>
      <button onClick={() => setModalAlocacoesAberto(true)}>
        Gerenciar Alocações
      </button>

      <TabelaAlocacoes
        salas={salas}
        turmas={turmas}
        alocacoes={alocacoes}
      />

      {modalSalasAberto && (
        <ModalSalas
          salas={salas}
          setSalas={setSalas}
          onClose={() => setModalSalasAberto(false)}
        />
      )}

      {modalCursosAberto && (
        <ModalCursos
          cursos={cursos}
          setCursos={setCursos}
          onClose={() => setModalCursosAberto(false)}
        />
      )}
      {modalTurmasAberto && (
        <ModalTurmas
          turmas={turmas}
          setTurmas={setTurmas}
          cursos={cursos}
          onClose={() => setModalTurmasAberto(false)}
        />
      )}
      {modalAlocacoesAberto && (
        <ModalAlocacoes
          turmas={turmas}
          salas={salas}
          alocacoes={alocacoes}
          setAlocacoes={setAlocacoes}
          onClose={() => setModalAlocacoesAberto(false)}
        />
      )}
      
    </>
  );
}

export default App;
