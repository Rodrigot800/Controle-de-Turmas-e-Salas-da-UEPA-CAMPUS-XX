import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import API_BASE from "../config/api";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function PaginaMetricas() {
  const [resumo, setResumo] = useState(null);
  const [professoresDestaque, setProfessoresDestaque] = useState([]);
  const [disciplinasNaoMinistradas, setDisciplinasNaoMinistradas] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [periodoSelecionado, setPeriodoSelecionado] = useState("");
  const [loading, setLoading] = useState(true);

  // Carrega os períodos disponíveis apenas uma vez
  useEffect(() => {
    async function carregarPeriodos() {
      try {
        const res = await fetch(`${API_BASE}/metricas/periodos`);
        if (res.ok) {
          const data = await res.json();
          setPeriodos(data);
          if (data.length > 0) {
            setPeriodoSelecionado(data[0]); // Seleciona o primeiro por padrão
          }
        }
      } catch (error) {
        console.error("Erro ao carregar períodos:", error);
      }
    }
    carregarPeriodos();
  }, []);

  // Carrega as métricas sempre que o período selecionado mudar
  useEffect(() => {
    async function carregarMetricas() {
      if (!periodoSelecionado && periodos.length > 0) return; // Aguarda ter um período selecionado se houver

      try {
        setLoading(true);
        const query = periodoSelecionado ? `?periodo=${periodoSelecionado}` : "";
        const [resResumo, resProfessores, resDisciplinasNao, resTurnos] = await Promise.all([
          fetch(`${API_BASE}/metricas/resumo${query}`),
          fetch(`${API_BASE}/metricas/professores-destaque${query}`),
          fetch(`${API_BASE}/metricas/disciplinas-nao-ministradas${query}`),
          fetch(`${API_BASE}/metricas/turnos${query}`)
        ]);

        if (resResumo.ok) setResumo(await resResumo.json());
        if (resProfessores.ok) setProfessoresDestaque(await resProfessores.json());
        if (resDisciplinasNao.ok) setDisciplinasNaoMinistradas(await resDisciplinasNao.json());
        if (resTurnos.ok) setTurnos(await resTurnos.json());
      } catch (error) {
        console.error("Erro ao carregar métricas:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarMetricas();
  }, [periodoSelecionado, periodos]);

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "60vh" }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Carregando...</span>
        </div>
      </div>
    );
  }

  // Prepara dados para o gráfico de pizza (turnos)
  const dadosTurnos = turnos.map((t) => ({
    name: t.turno,
    value: parseInt(t.quantidade)
  }));
  const totalTurmasAtivasTurno = dadosTurnos.reduce((acc, curr) => acc + curr.value, 0);

  // Prepara dados para o gráfico de barras (disciplinas não ministradas)
  const dadosBarras = disciplinasNaoMinistradas?.detalhes?.map((d) => ({
    name: d.curso_nome,
    "Não Ministradas": parseInt(d.total_nao_ministradas)
  })) || [];

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      
      {/* HEADER DE FILTRO */}
      <div className="row mb-4">
        <div className="col-12 d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0 text-dark">Visão Geral</h4>
          <div className="d-flex align-items-center">
            <label className="me-2 fw-medium text-muted">Filtrar por Semestre:</label>
            <select 
              className="form-select shadow-sm border-0" 
              style={{ width: "auto", minWidth: "150px" }}
              value={periodoSelecionado}
              onChange={(e) => setPeriodoSelecionado(e.target.value)}
            >
              <option value="">Todos os Semestres</option>
              {periodos.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: CARDS DE RESUMO */}
      <div className="row mb-4">
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0" style={{ borderRadius: "12px", borderLeft: "5px solid #0088FE" }}>
            <div className="card-body">
              <h6 className="text-muted text-uppercase mb-2">Total de Disciplinas (Campus)</h6>
              <h2 className="mb-0 fw-bold">{resumo?.totalDisciplinas || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0" style={{ borderRadius: "12px", borderLeft: "5px solid #00C49F" }}>
            <div className="card-body">
              <h6 className="text-muted text-uppercase mb-2">Disciplinas Sendo Ministradas</h6>
              <h2 className="mb-0 fw-bold">{resumo?.disciplinasMinistradas || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0" style={{ borderRadius: "12px", borderLeft: "5px solid #FFBB28" }}>
            <div className="card-body">
              <h6 className="text-muted text-uppercase mb-2">Professores Ativos</h6>
              <h2 className="mb-0 fw-bold">{resumo?.professoresAtivos || 0}</h2>
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0" style={{ borderRadius: "12px", borderLeft: "5px solid #FF8042" }}>
            <div className="card-body">
              <h6 className="text-muted text-uppercase mb-2">Turmas Ativas</h6>
              <h2 className="mb-0 fw-bold">{resumo?.totalTurmas || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      <div className="row mb-4">
        {/* GRÁFICO DE BARRAS: Disciplinas Não Ministradas por Curso */}
        <div className="col-lg-8 mb-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">Disciplinas Não Ministradas por Curso</h5>
              <small className="text-muted">Total: {disciplinasNaoMinistradas?.totalGeral || 0} disciplinas aguardando oferta</small>
            </div>
            <div className="card-body" style={{ minHeight: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarras} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend />
                  <Bar dataKey="Não Ministradas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* GRÁFICO DE PIZZA: Distribuição por Turnos */}
        <div className="col-lg-4 mb-4">
          <div className="card shadow-sm border-0 h-100" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-white border-0 pt-4 pb-0">
              <h5 className="mb-0 fw-bold text-dark">Turmas por Turno</h5>
              <small className="text-muted">Total: {totalTurmasAtivasTurno} turmas tendo aula</small>
            </div>
            <div className="card-body d-flex justify-content-center align-items-center" style={{ minHeight: "350px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosTurnos}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {dadosTurnos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* TABELA: Professores Destaque */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm border-0" style={{ borderRadius: "12px" }}>
            <div className="card-header bg-white border-0 pt-4 pb-3">
              <h5 className="mb-0 fw-bold text-dark">Professores com Mais Disciplinas (Por Curso)</h5>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="ps-4 border-0">Curso</th>
                      <th className="border-0">Professor</th>
                      <th className="pe-4 border-0 text-center">Total de Disciplinas Ministradas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {professoresDestaque.map((item, index) => (
                      <tr key={index}>
                        <td className="ps-4 fw-medium text-dark">{item.curso_nome}</td>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary text-white rounded-circle d-flex justify-content-center align-items-center me-3" style={{ width: "35px", height: "35px", fontSize: "14px", fontWeight: "bold" }}>
                              {item.professor_nome.charAt(0)}
                            </div>
                            {item.professor_nome}
                          </div>
                        </td>
                        <td className="pe-4 text-center">
                          <span className="badge bg-success rounded-pill px-3 py-2" style={{ fontSize: "14px" }}>
                            {item.total_disciplinas}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {professoresDestaque.length === 0 && (
                      <tr>
                        <td colSpan="3" className="text-center text-muted py-4">Nenhum dado de alocação encontrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
