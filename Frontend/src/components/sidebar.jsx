import logoHYDRAZIL from "../assets/HYDRAZIL_LOGO.png";
import "../style/sidebar.css";
export default function Sidebar({ menuAtivo, setMenuAtivo }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
      <img src={logoHYDRAZIL} alt="Logo da HYDRAZIL" />
      </div>

      <button
        className={menuAtivo === "central" ? "active" : ""}
        onClick={() => setMenuAtivo("central")}
      >
        Central IA
      </button>

      <button
        className={menuAtivo === "gerenciamento" ? "active" : ""}
        onClick={() => setMenuAtivo("gerenciamento")}
      >
        Gerenciamento
      </button>

      <button
        className={menuAtivo === "metricas" ? "active" : ""}
        onClick={() => setMenuAtivo("metricas")}
      >
        Métricas
      </button>
    </div>
  );
}
