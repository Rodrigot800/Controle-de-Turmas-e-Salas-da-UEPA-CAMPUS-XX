import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import API_BASE from "../config/api";
import "../style/paginaMetricas.css";

const EMPTY_FILTERS = {
  periodo: "",
  curso_id: "",
  turno: "",
  sala_id: "",
  tipo: "",
};

const CHART_COLORS = ["#3157d5", "#12a594", "#f0a238", "#7b61d1", "#d95d72"];
const numberFormatter = new Intl.NumberFormat("pt-BR");
const toNumber = (value) => Number(value) || 0;

function monthLabel(value) {
  if (!value) return "";
  const [year, month] = value.split("-");
  return new Intl.DateTimeFormat("pt-BR", { month: "short" })
    .format(new Date(Number(year), Number(month) - 1, 1))
    .replace(".", "");
}

function MetricCard({ label, value, detail, token, tone }) {
  return (
    <article className={"metrics-kpi metrics-kpi--" + tone}>
      <div className="metrics-kpi__top">
        <span className="metrics-kpi__token" aria-hidden="true">{token}</span>
        <span className="metrics-kpi__label">{label}</span>
      </div>
      <strong className="metrics-kpi__value">{numberFormatter.format(value)}</strong>
      <span className="metrics-kpi__detail">{detail}</span>
    </article>
  );
}

function EmptyChart({ message = "Nenhum dado encontrado para este recorte." }) {
  return (
    <div className="metrics-empty">
      <span className="metrics-empty__mark">—</span>
      <p>{message}</p>
    </div>
  );
}

function ChartCard({ title, subtitle, children, className = "" }) {
  return (
    <section className={"metrics-card " + className}>
      <header className="metrics-card__header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </header>
      <div className="metrics-card__body">{children}</div>
    </section>
  );
}

export default function PaginaMetricasNova() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [dashboard, setDashboard] = useState(null);
  const [options, setOptions] = useState({
    periodos: [],
    cursos: [],
    salas: [],
    turnos: [],
    tipos: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const defaultPeriodApplied = useRef(false);
  const hasDashboard = useRef(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadDashboard() {
      try {
        if (hasDashboard.current) setRefreshing(true);
        else setLoading(true);
        setError("");

        const query = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== "") query.set(key, value);
        });
        const suffix = query.toString() ? "?" + query.toString() : "";
        const response = await fetch(API_BASE + "/metricas/dashboard" + suffix, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "Não foi possível carregar as métricas.");
        }

        setDashboard(payload);
        hasDashboard.current = true;
        setOptions(payload.opcoes);

        if (!defaultPeriodApplied.current) {
          defaultPeriodApplied.current = true;
          const latestPeriod = payload.opcoes?.periodos?.[0];
          if (!filters.periodo && latestPeriod) {
            setFilters((current) => ({ ...current, periodo: latestPeriod }));
          }
        }
      } catch (requestError) {
        if (requestError.name !== "AbortError") setError(requestError.message);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    loadDashboard();
    return () => controller.abort();
  }, [filters]);

  const summary = dashboard?.resumo || {};
  const timeline = useMemo(
    () => (dashboard?.ofertasPorMes || []).map((item) => ({
      ...item,
      label: monthLabel(item.mes),
      modular: toNumber(item.modular),
      regular: toNumber(item.regular),
    })),
    [dashboard],
  );
  const courseData = useMemo(
    () => (dashboard?.ofertasPorCurso || []).map((item) => ({
      ...item,
      ofertas: toNumber(item.ofertas),
    })),
    [dashboard],
  );
  const roomData = useMemo(
    () => (dashboard?.usoPorSala || []).map((item) => ({
      ...item,
      ofertas: toNumber(item.ofertas),
    })),
    [dashboard],
  );
  const typeData = useMemo(
    () => (dashboard?.distribuicaoTipo || []).map((item) => ({
      name: item.nome === "SEMANAL" ? "Regular" : "Modular",
      value: toNumber(item.quantidade),
    })),
    [dashboard],
  );
  const totalType = typeData.reduce((sum, item) => sum + item.value, 0);
  const activeFilters = Object.values(filters).filter((value) => value !== "").length;
  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  if (loading && !dashboard) {
    return (
      <div className="metrics-loading" role="status">
        <span className="metrics-loading__spinner" />
        <strong>Preparando indicadores acadêmicos</strong>
        <small>Cruzando turmas, disciplinas, salas e docentes…</small>
      </div>
    );
  }

  return (
    <div className="metrics-page">
      <section className="metrics-hero">
        <div>
          <span className="metrics-eyebrow">ANÁLISE ACADÊMICA</span>
          <h2>Visão consolidada das alocações</h2>
          <p>Todos os indicadores abaixo respondem ao mesmo conjunto de filtros.</p>
        </div>
        <div className="metrics-update">
          <span className={refreshing ? "metrics-update__dot is-refreshing" : "metrics-update__dot"} />
          {refreshing
            ? "Atualizando…"
            : dashboard?.atualizadoEm
              ? "Atualizado às " + new Date(dashboard.atualizadoEm).toLocaleTimeString(
                "pt-BR",
                { hour: "2-digit", minute: "2-digit" },
              )
              : "Dados atualizados"}
        </div>
      </section>

      <section className="metrics-filters" aria-label="Filtros das métricas">
        <div className="metrics-filters__heading">
          <div>
            <span>Filtros</span>
            <small>{activeFilters} ativo{activeFilters === 1 ? "" : "s"}</small>
          </div>
          <button
            type="button"
            className="metrics-filter-clear"
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={activeFilters === 0}
          >
            Limpar filtros
          </button>
        </div>
        <div className="metrics-filter-grid">
          <label>
            <span>Período letivo</span>
            <select value={filters.periodo} onChange={(event) => updateFilter("periodo", event.target.value)}>
              <option value="">Todos os períodos</option>
              {options.periodos.map((period) => <option key={period} value={period}>{period}</option>)}
            </select>
          </label>
          <label>
            <span>Curso</span>
            <select value={filters.curso_id} onChange={(event) => updateFilter("curso_id", event.target.value)}>
              <option value="">Todos os cursos</option>
              {options.cursos.map((course) => <option key={course.id} value={course.id}>{course.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Turno</span>
            <select value={filters.turno} onChange={(event) => updateFilter("turno", event.target.value)}>
              <option value="">Todos os turnos</option>
              {options.turnos.map((shift) => <option key={shift} value={shift}>{shift}</option>)}
            </select>
          </label>
          <label>
            <span>Sala</span>
            <select value={filters.sala_id} onChange={(event) => updateFilter("sala_id", event.target.value)}>
              <option value="">Todas as salas</option>
              {options.salas.map((room) => <option key={room.id} value={room.id}>{room.nome}</option>)}
            </select>
          </label>
          <label>
            <span>Tipo de oferta</span>
            <select value={filters.tipo} onChange={(event) => updateFilter("tipo", event.target.value)}>
              <option value="">Modular e regular</option>
              {options.tipos.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>
        </div>
      </section>

      {error && (
        <div className="metrics-error" role="alert">
          <strong>Não foi possível atualizar as métricas.</strong>
          <span>{error}</span>
        </div>
      )}

      <section className="metrics-kpi-grid">
        <MetricCard label="Ofertas" value={toNumber(summary.ofertas)} detail="alocações no recorte" token="OF" tone="blue" />
        <MetricCard label="Carga horária" value={toNumber(summary.carga_horaria)} detail="horas ofertadas" token="CH" tone="indigo" />
        <MetricCard label="Disciplinas" value={toNumber(summary.disciplinas)} detail="componentes distintos" token="DI" tone="teal" />
        <MetricCard label="Turmas" value={toNumber(summary.turmas)} detail="turmas atendidas" token="TU" tone="amber" />
        <MetricCard label="Docentes" value={toNumber(summary.professores)} detail="professores envolvidos" token="DO" tone="rose" />
        <MetricCard label="Salas" value={toNumber(summary.salas)} detail="espaços utilizados" token="SA" tone="slate" />
      </section>

      <section className="metrics-chart-grid metrics-chart-grid--primary">
        <ChartCard title="Início das ofertas por mês" subtitle="Disciplinas que começam em cada mês, separadas por formato">
          {timeline.length === 0 ? <EmptyChart /> : (
            <div className="metrics-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={timeline} margin={{ top: 12, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#657188", fontSize: 12 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#657188", fontSize: 12 }} />
                  <Tooltip cursor={{ fill: "#f3f6fb" }} contentStyle={{ border: 0, borderRadius: 12 }} />
                  <Legend iconType="circle" />
                  <Bar name="Modular" dataKey="modular" stackId="offers" fill="#12a594" />
                  <Bar name="Regular" dataKey="regular" stackId="offers" fill="#3157d5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Formato das ofertas" subtitle="Proporção entre disciplinas modulares e regulares">
          {typeData.length === 0 ? <EmptyChart /> : (
            <div className="metrics-donut-wrap">
              <ResponsiveContainer width="100%" height={255}>
                <PieChart>
                  <Pie data={typeData} dataKey="value" nameKey="name" innerRadius={67} outerRadius={94} paddingAngle={3}>
                    {typeData.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ border: 0, borderRadius: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="metrics-donut-total"><strong>{totalType}</strong><span>ofertas</span></div>
              <div className="metrics-donut-legend">
                {typeData.map((item, index) => (
                  <span key={item.name}>
                    <i style={{ background: CHART_COLORS[index] }} />{item.name} <strong>{item.value}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}
        </ChartCard>
      </section>

      <section className="metrics-chart-grid">
        <ChartCard title="Oferta por curso" subtitle="Quantidade de alocações por curso">
          {courseData.length === 0 ? <EmptyChart /> : (
            <div className="metrics-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={courseData} layout="vertical" margin={{ top: 8, right: 16, left: 12, bottom: 0 }}>
                  <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="nome" width={132} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ border: 0, borderRadius: 12 }} />
                  <Bar name="Ofertas" dataKey="ofertas" fill="#3157d5" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>

        <ChartCard title="Salas mais utilizadas" subtitle="Número de ofertas associadas a cada sala">
          {roomData.length === 0 ? <EmptyChart /> : (
            <div className="metrics-chart-frame">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roomData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#e9edf5" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="nome" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ border: 0, borderRadius: 12 }} />
                  <Bar name="Ofertas" dataKey="ofertas" fill="#7b61d1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </ChartCard>
      </section>

      <section className="metrics-bottom-grid">
        <ChartCard title="Carga docente" subtitle="Professores com mais ofertas no recorte">
          <div className="metrics-table-wrap">
            <table className="metrics-table">
              <thead>
                <tr><th>Docente</th><th>Ofertas</th><th>Disciplinas</th><th>Turmas</th><th>CH</th></tr>
              </thead>
              <tbody>
                {(dashboard?.professores || []).map((teacher) => (
                  <tr key={teacher.id}>
                    <td><span className="metrics-avatar">{teacher.nome.charAt(0)}</span><strong>{teacher.nome}</strong></td>
                    <td>{teacher.ofertas}</td>
                    <td>{teacher.disciplinas}</td>
                    <td>{teacher.turmas}</td>
                    <td>{numberFormatter.format(toNumber(teacher.carga_horaria))}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(dashboard?.professores || []).length === 0 && <EmptyChart message="Nenhum docente no recorte atual." />}
          </div>
        </ChartCard>

        <ChartCard title="Disciplinas sem oferta" subtitle="Componentes atuais ainda não encontrados no recorte">
          <div className="metrics-pending-list">
            {(dashboard?.disciplinasSemOferta || []).map((item) => (
              <div className="metrics-pending-item" key={item.curso_id}>
                <div><strong>{item.curso_nome}</strong><span>sem oferta registrada</span></div>
                <b>{item.quantidade}</b>
              </div>
            ))}
            {(dashboard?.disciplinasSemOferta || []).length === 0 && (
              <EmptyChart message="Todas as disciplinas do recorte possuem oferta." />
            )}
          </div>
        </ChartCard>
      </section>
    </div>
  );
}
