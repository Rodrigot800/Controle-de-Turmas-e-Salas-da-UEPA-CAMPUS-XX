import { useState, useEffect } from "react";
import Header from "./components/header";
import ModalSalas from "./components/modalSalas";

function App() {
  const [modalAberto, setModalAberto] = useState(false);

  const [salas, setSalas] = useState(() => {
  const salvo = localStorage.getItem("salas");
    return salvo ? JSON.parse(salvo) : [];
  });

  useEffect(() => {
    localStorage.setItem("salas", JSON.stringify(salas));
  }, [salas]);

  return (
    <>
      <Header />

      <button onClick={() => setModalAberto(true)}>
        Gerenciar Salas
      </button>

      {modalAberto && (
        <ModalSalas
          salas={salas}
          setSalas={setSalas}
          onClose={() => setModalAberto(false)}
        />
      )}
    </>
  );
}

export default App;
