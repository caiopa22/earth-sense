import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { ThemeToggle } from "@/components/theme-toggle";
import Logo from "~/components/ui/logo";
import { TEAM } from "~/lib/constants";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "EarthSense — Monitoramento de umidade do solo | TCC UNIP" },
    {
      name: "description",
      content:
        "Protótipo de monitoramento periódico da umidade do solo com ESP32, API Node.js, Supabase e previsão de umidade por aprendizado de máquina. TCC de Ciência da Computação — UNIP 2026.",
    },
  ];
}

export const links: Route.LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap",
  },
];

/* ------------------------------------------------------------------ */
/* Série ilustrativa: reproduz o padrão descrito no TCC (variação lenta */
/* à noite, queda acentuada sob sol, sensores 1 e 4 estabilizando na    */
/* sombra). Determinística para não divergir entre servidor e cliente. */
/* ------------------------------------------------------------------ */

const SENSORS = [
  { id: "S1", base: 84, night: 0.18, sunDrop: 2.2, shade: true, color: "var(--primary)" },
  { id: "S2", base: 74, night: 0.1, sunDrop: 3.1, shade: false, color: "#3b82f6" },
  { id: "S3", base: 80, night: 0.22, sunDrop: 3.9, shade: false, color: "#f59e0b" },
  { id: "S4", base: 63, night: 0.08, sunDrop: 2.4, shade: true, color: "#ef4444" },
  { id: "S5", base: 56, night: 0.14, sunDrop: 2.6, shade: false, color: "#8b5cf6" },
];

const POINTS = 49; // 24h em passos de 30 min, das 18h às 18h
const CHART = { w: 560, h: 220, top: 12, bottom: 8 };

function seriesFor(s: (typeof SENSORS)[number], idx: number) {
  const values: number[] = [];
  let v = s.base;
  // POINTS + 1: o último ponto é o valor 30 min à frente, exibido como previsão
  for (let t = 0; t <= POINTS; t++) {
    const hour = (18 + t / 2) % 24;
    const sun = hour >= 9 && hour < 16;
    const shadeBack = s.shade && hour >= 13 && hour < 18;
    if (sun && !shadeBack) v -= s.sunDrop;
    else if (shadeBack) v -= 0.04;
    else v -= s.night;
    const wiggle = Math.sin(t * 0.9 + idx * 1.7) * 0.6;
    values.push(Math.max(8, v + wiggle));
  }
  return values;
}

function toPath(values: number[]) {
  const { w, h, top, bottom } = CHART;
  const y = (n: number) => top + (1 - n / 100) * (h - top - bottom);
  const x = (i: number) => (i / (POINTS - 1)) * w;
  return values
    .map((n, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(n).toFixed(1)}`)
    .join(" ");
}

const SERIES = SENSORS.map((s, i) => {
  const all = seriesFor(s, i);
  const values = all.slice(0, POINTS);
  return { ...s, path: toPath(values), last: values[POINTS - 1], next: all[POINTS] };
});

/* ------------------------------------------------------------------ */
/* Conteúdo — números retirados de docs/TCC.txt                        */
/* ------------------------------------------------------------------ */

const FIGURES = [
  { value: "1.000", unit: "", label: "leituras analisadas entre 27 e 28 de setembro" },
  { value: "301,33", unit: "s", label: "intervalo mediano entre recepções (alvo: 300 s)" },
  { value: "0", unit: "", label: "duplicatas por dispositivo, lote e sensor" },
  { value: "140", unit: "ms", label: "tempo de resposta da API, informado pela equipe" },
];

const PIPELINE = [
  {
    n: "01",
    title: "Coleta",
    where: "ESP32 · 5 sensores capacitivos",
    body: "Cada sensor é lido pelo ADC de 12 bits e convertido para a escala de 0 a 100% por interpolação entre as referências seca (3100) e úmida (700).",
  },
  {
    n: "02",
    title: "Envio em lote",
    where: "POST /api/soil-readings/batch",
    body: "A cada cinco minutos, um único pacote leva as leituras de todos os sensores, autenticado pela chave própria do dispositivo. Se a rede falhar, até três novas tentativas com o mesmo batch_id.",
  },
  {
    n: "03",
    title: "Persistência",
    where: "Node.js · Express 5 · Supabase",
    body: "A API valida e grava no PostgreSQL. A restrição de unicidade por dispositivo, lote e sensor garante que um reenvio nunca vire leitura duplicada.",
  },
  {
    n: "04",
    title: "Previsão",
    where: "GET /api/ml/forecast",
    body: "As quatro leituras mais recentes de cada sensor passam por uma regressão Ridge, treinada em Python e exportada como coeficientes. A conta roda no próprio backend, sem Python em produção.",
  },
  {
    n: "05",
    title: "Leitura",
    where: "React 19 · Recharts",
    body: "O dashboard mostra a umidade atual, o histórico de cada sensor e, lado a lado, a umidade prevista para daqui a 30 minutos com o erro médio do modelo.",
  },
];

/* ------------------------------------------------------------------ */
/* Previsão — erro médio (MAE) de ml/output/metrics.json, em pontos    */
/* percentuais, no conjunto de teste                                    */
/* ------------------------------------------------------------------ */

const FORECAST_MAE = [
  { id: "S1", ridge: 1.6, persistence: 2.09 },
  { id: "S2", ridge: 0.87, persistence: 0.82 },
  { id: "S3", ridge: 6.58, persistence: 5.29 },
  { id: "S4", ridge: 6.99, persistence: 6.57 },
  { id: "S5", ridge: 10.99, persistence: 9.1 },
];
const MAE_MAX = 12;

/* Exemplo ilustrativo do sensor S1: 4 leituras de entrada e a previsão */
/* para t + 30 min, com a faixa de ± MAE do Ridge nesse sensor.         */
const FC = { w: 520, h: 250, left: 34, right: 16, top: 20, bottom: 30 };
const FC_X = { min: -20, max: 35 };
const FC_Y = { min: 62, max: 76 };
const FC_INPUT = [
  { m: -15, v: 71.2 },
  { m: -10, v: 70.8 },
  { m: -5, v: 70.3 },
  { m: 0, v: 69.9 },
];
const FC_NOW = FC_INPUT[FC_INPUT.length - 1];
const FC_PRED = { m: 30, v: 68.4, mae: 1.6 };

const fcX = (m: number) =>
  FC.left + ((m - FC_X.min) / (FC_X.max - FC_X.min)) * (FC.w - FC.left - FC.right);
const fcY = (v: number) =>
  FC.top + (1 - (v - FC_Y.min) / (FC_Y.max - FC_Y.min)) * (FC.h - FC.top - FC.bottom);

const formatPt = (n: number, digits = 1) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const STACK = [
  "ESP32",
  "Node.js",
  "Express 5",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "React 19",
  "Python",
  "scikit-learn",
];

/* ------------------------------------------------------------------ */

export default function Home() {
  return (
    <div className="landing relative min-h-screen overflow-x-clip">
      <div className="grain pointer-events-none fixed inset-0 z-0" aria-hidden />

      {/* NAV */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-(--line) bg-(--paper)/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="EarthSense — início">
            <Logo className="h-10" />
          </Link>
          <nav className="hidden items-center gap-8 text-sm text-(--ink-soft) md:flex">
            <a href="#sistema" className="transition-colors hover:text-(--ink)">
              Sistema
            </a>
            <a href="#resultados" className="transition-colors hover:text-(--ink)">
              Resultados
            </a>
            <a href="#previsao" className="transition-colors hover:text-(--ink)">
              Previsão
            </a>
            <a href="#equipe" className="transition-colors hover:text-(--ink)">
              Equipe
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="rounded-full border-(--line) bg-transparent text-(--ink)" />
            <Link
              to="/auth"
              className="group inline-flex h-9 items-center gap-1.5 rounded-full bg-(--ink) px-4 text-sm font-medium text-(--paper) transition-transform hover:-translate-y-px"
            >
              Entrar
              <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto grid max-w-7xl gap-14 px-5 pt-32 pb-20 sm:px-8 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16 lg:pt-40 lg:pb-28">
          <div>
            <p
              className="es-rise font-data text-[11px] tracking-[0.2em] text-(--ink-soft) uppercase"
              style={{ animationDelay: "0ms" }}
            >
              TCC · Ciência da Computação · UNIP 2026
            </p>
            <h1
              className="es-rise font-display mt-6 text-[clamp(3.2rem,8vw,6.6rem)] leading-[0.92] text-(--ink)"
              style={{ animationDelay: "120ms" }}
            >
              Ouvir o solo,
              <br />
              <em className="text-primary">a cada cinco</em>
              <br />
              minutos.
            </h1>
            <p
              className="es-rise mt-8 max-w-md text-base leading-relaxed text-(--ink-soft) sm:text-lg"
              style={{ animationDelay: "240ms" }}
            >
              O EarthSense conecta sensores capacitivos a um ESP32, guarda cada leitura na nuvem e
              usa a série histórica para prever a umidade de cada sensor nos próximos 30 minutos.
            </p>
            <div
              className="es-rise mt-10 flex flex-wrap items-center gap-3"
              style={{ animationDelay: "360ms" }}
            >
              <Link
                to="/auth"
                className="group inline-flex h-12 items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Abrir o dashboard
                <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <a
                href="#sistema"
                className="group inline-flex h-12 items-center gap-2 rounded-full border border-(--line) px-6 text-sm font-medium text-(--ink) transition-colors hover:bg-(--paper-2)"
              >
                Como funciona
                <ArrowDownRight className="size-4 transition-transform group-hover:translate-y-0.5" />
              </a>
            </div>
          </div>

          {/* Instrumento */}
          <figure
            className="es-rise relative overflow-hidden rounded-[1.75rem] bg-(--panel) p-5 text-(--panel-ink) shadow-[0_30px_80px_-30px_oklch(0_0_0/0.5)] sm:p-7"
            style={{ animationDelay: "300ms" }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-data text-[10px] tracking-[0.2em] text-white/50 uppercase">
                  Umidade do solo · %
                </p>
                <p className="font-display mt-1 text-3xl">Dispositivo 01</p>
              </div>
              <span className="font-data rounded-full border border-(--panel-line) px-3 py-1 text-[10px] tracking-wider text-white/60 uppercase">
                5 canais
              </span>
            </div>

            <div className="relative mt-6">
              <svg
                viewBox={`0 0 ${CHART.w} ${CHART.h}`}
                className="w-full overflow-visible"
                role="img"
                aria-label="Gráfico ilustrativo de umidade dos cinco sensores ao longo de 24 horas"
              >
                {[0, 25, 50, 75, 100].map((g) => {
                  const y = CHART.top + (1 - g / 100) * (CHART.h - CHART.top - CHART.bottom);
                  return (
                    <g key={g}>
                      <line x1="0" x2={CHART.w} y1={y} y2={y} stroke="white" strokeOpacity="0.07" />
                      <text
                        x={CHART.w}
                        y={y - 4}
                        textAnchor="end"
                        className="font-data"
                        fontSize="9"
                        fill="white"
                        fillOpacity="0.35"
                      >
                        {g}
                      </text>
                    </g>
                  );
                })}
                {/* faixa de sol */}
                <rect
                  x={(30 / 48) * CHART.w}
                  width={(14 / 48) * CHART.w}
                  y="0"
                  height={CHART.h}
                  fill="#f59e0b"
                  fillOpacity="0.06"
                />
                <text
                  x={(30 / 48) * CHART.w + 6}
                  y={CHART.h - 4}
                  className="font-data"
                  fontSize="9"
                  fill="#f59e0b"
                  fillOpacity="0.6"
                >
                  SOL
                </text>
                {SERIES.map((s, i) => (
                  <path
                    key={s.id}
                    d={s.path}
                    pathLength={1}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="es-draw"
                    style={{ animationDelay: `${500 + i * 140}ms` }}
                  />
                ))}
              </svg>
              <div
                className="pointer-events-none absolute inset-y-0 left-0 w-full overflow-hidden"
                aria-hidden
              >
                <div className="es-scan h-full w-full">
                  <div className="h-full w-px bg-linear-to-b from-transparent via-white/30 to-transparent" />
                </div>
              </div>
            </div>

            <div className="font-data mt-2 flex justify-between text-[10px] text-white/40">
              <span>18h</span>
              <span>00h</span>
              <span>06h</span>
              <span>12h</span>
              <span>18h</span>
            </div>

            <ul className="mt-6 grid grid-cols-5 gap-2 border-t border-(--panel-line) pt-5">
              {SERIES.map((s) => (
                <li key={s.id}>
                  <span className="font-data flex items-center gap-1.5 text-[10px] text-white/50">
                    <span className="size-1.5 rounded-full" style={{ background: s.color }} />
                    {s.id}
                  </span>
                  <span className="font-data mt-1 block text-lg tabular-nums sm:text-xl">
                    {Math.round(s.last)}
                    <span className="text-xs text-white/40">%</span>
                  </span>
                  <span className="font-data mt-0.5 block text-[10px] text-white/40 tabular-nums">
                    → {Math.round(s.next)}%<span className="hidden sm:inline"> em 30 min</span>
                  </span>
                </li>
              ))}
            </ul>

            <figcaption className="mt-5 text-[11px] leading-relaxed text-white/40">
              Série ilustrativa no padrão observado no TCC: variação lenta à noite, queda sob sol,
              estabilização dos sensores S1 e S4 na sombra. Abaixo de cada valor, a previsão para
              daqui a 30 minutos.
            </figcaption>
          </figure>
        </section>

        {/* STACK */}
        <div className="border-y border-(--line)">
          <ul className="font-data mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-5 text-xs tracking-wider text-(--ink-soft) uppercase sm:px-8">
            {STACK.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        {/* SISTEMA */}
        <section
          id="sistema"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr] lg:items-end">
            <h2 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">
              Do sensor
              <br />
              <em className="text-primary">à resposta.</em>
            </h2>
            <p className="max-w-xl text-(--ink-soft) lg:justify-self-end">
              Cinco etapas, cada uma com uma responsabilidade clara. O caminho de uma leitura, desde
              o momento em que é medida no campo até virar previsão no dashboard.
            </p>
          </div>

          <ol className="mt-16 grid gap-x-8 md:grid-cols-2 lg:grid-cols-5">
            {PIPELINE.map((step) => (
              <li key={step.n} className="group relative border-t border-(--line) pt-8 pb-12">
                <span className="absolute -top-px left-0 h-px w-0 bg-primary transition-all duration-500 group-hover:w-full" />
                <span className="font-data text-xs text-primary">{step.n}</span>
                <h3 className="font-display mt-4 text-3xl">{step.title}</h3>
                <p className="font-data mt-2 text-[11px] text-(--ink-soft)">{step.where}</p>
                <p className="mt-6 text-sm leading-relaxed text-(--ink-soft)">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* RESULTADOS */}
        <section id="resultados" className="scroll-mt-16 bg-(--paper-2)">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-32">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <h2 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">
                O que os dados
                <br />
                <em className="text-primary">mostraram.</em>
              </h2>
              <p className="font-data max-w-xs text-xs leading-relaxed text-(--ink-soft)">
                Análise de 249 instantes de recepção do protótipo com cinco sensores.
              </p>
            </div>

            <dl className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-(--line) bg-(--line) sm:grid-cols-2 lg:grid-cols-4">
              {FIGURES.map((f) => (
                <div key={f.label} className="bg-(--paper) p-8 sm:p-10">
                  <dt className="sr-only">{f.label}</dt>
                  <dd>
                    <span className="font-display text-6xl tabular-nums sm:text-7xl">
                      {f.value}
                    </span>
                    {f.unit && (
                      <span className="font-data ml-1 text-sm text-(--ink-soft)">{f.unit}</span>
                    )}
                    <p className="mt-6 max-w-[16rem] text-sm leading-relaxed text-(--ink-soft)">
                      {f.label}
                    </p>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* PREVISÃO */}
        <section
          id="previsao"
          className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32"
        >
          <div className="grid gap-14 lg:grid-cols-[1fr_1.15fr] lg:items-center lg:gap-20">
            <div>
              <p className="font-data text-[11px] tracking-[0.2em] text-(--ink-soft) uppercase">
                Previsão · Regressão Ridge
              </p>
              <h2 className="font-display mt-5 text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">
                A umidade de
                <br />
                <em className="text-primary">daqui a 30 minutos.</em>
              </h2>
              <p className="mt-8 max-w-md leading-relaxed text-(--ink-soft)">
                Um modelo treinado com as leituras do próprio protótipo estima a umidade de cada
                sensor meia hora à frente. A conta é feita na hora, a cada consulta, a partir das
                leituras mais recentes.
              </p>

              <ol className="mt-10">
                {[
                  [
                    "Entrada",
                    "As 4 leituras mais recentes do sensor, suas diferenças, média e desvio.",
                  ],
                  [
                    "Modelo",
                    "Regressão Ridge treinada em Python e exportada como coeficientes em JSON.",
                  ],
                  [
                    "Saída",
                    "Umidade prevista para t + 30 min, a faixa correspondente e o erro médio do modelo.",
                  ],
                ].map(([label, text], i) => (
                  <li
                    key={label}
                    className="flex gap-4 border-t border-(--line) py-4 text-sm leading-relaxed text-(--ink-soft)"
                  >
                    <span className="font-data pt-0.5 text-[10px] text-primary">0{i + 1}</span>
                    <div>
                      <p className="font-data mb-1 text-[10px] tracking-[0.2em] text-(--ink) uppercase">
                        {label}
                      </p>
                      {text}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Instrumento de previsão */}
            <figure className="relative overflow-hidden rounded-[1.75rem] bg-(--panel) p-5 text-(--panel-ink) shadow-[0_30px_80px_-30px_oklch(0_0_0/0.5)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-data text-[10px] tracking-[0.2em] text-white/50 uppercase">
                    Sensor S1 · exemplo
                  </p>
                  <p className="font-display mt-1 text-4xl tabular-nums">
                    {formatPt(FC_PRED.v)}
                    <span className="font-data ml-1 text-sm text-white/50">%</span>
                    <span className="font-data ml-3 text-xs text-white/40">
                      ± {formatPt(FC_PRED.mae)} p.p.
                    </span>
                  </p>
                </div>
                <span className="font-data shrink-0 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] tracking-wider text-primary uppercase">
                  t + 30 min
                </span>
              </div>

              <svg
                viewBox={`0 0 ${FC.w} ${FC.h}`}
                className="mt-6 w-full overflow-visible"
                role="img"
                aria-label="Exemplo de previsão: quatro leituras recentes do sensor S1 e a umidade prevista para daqui a 30 minutos, com a faixa de erro médio"
              >
                {/* zona de previsão */}
                <rect
                  x={fcX(0)}
                  y={FC.top}
                  width={fcX(FC_X.max) - fcX(0)}
                  height={FC.h - FC.top - FC.bottom}
                  fill="var(--primary)"
                  fillOpacity="0.05"
                />
                {[64, 68, 72, 76].map((g) => (
                  <g key={g}>
                    <line
                      x1={FC.left}
                      x2={FC.w - FC.right}
                      y1={fcY(g)}
                      y2={fcY(g)}
                      stroke="white"
                      strokeOpacity="0.07"
                    />
                    <text
                      x={FC.left - 8}
                      y={fcY(g) + 3}
                      textAnchor="end"
                      className="font-data"
                      fontSize="9"
                      fill="white"
                      fillOpacity="0.35"
                    >
                      {g}
                    </text>
                  </g>
                ))}

                {/* limite entre as faixas alta e ótima */}
                <line
                  x1={FC.left}
                  x2={FC.w - FC.right}
                  y1={fcY(70)}
                  y2={fcY(70)}
                  stroke="#3b82f6"
                  strokeOpacity="0.55"
                  strokeDasharray="2 4"
                />
                <text
                  x={fcX(-20) + 4}
                  y={fcY(70) - 6}
                  className="font-data"
                  fontSize="9"
                  fill="#3b82f6"
                  fillOpacity="0.85"
                >
                  70% · ALTA ↑ ÓTIMA ↓
                </text>

                {/* faixa de erro (± MAE) */}
                <path
                  d={`M${fcX(FC_NOW.m)},${fcY(FC_NOW.v)} L${fcX(FC_PRED.m)},${fcY(FC_PRED.v + FC_PRED.mae)} L${fcX(FC_PRED.m)},${fcY(FC_PRED.v - FC_PRED.mae)} Z`}
                  fill="var(--primary)"
                  fillOpacity="0.16"
                />

                {/* leituras de entrada */}
                <path
                  d={FC_INPUT.map((p, i) => `${i === 0 ? "M" : "L"}${fcX(p.m)},${fcY(p.v)}`).join(
                    " ",
                  )}
                  fill="none"
                  stroke="white"
                  strokeOpacity="0.85"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                {/* projeção */}
                <line
                  x1={fcX(FC_NOW.m)}
                  y1={fcY(FC_NOW.v)}
                  x2={fcX(FC_PRED.m)}
                  y2={fcY(FC_PRED.v)}
                  stroke="var(--primary)"
                  strokeWidth="2"
                  strokeDasharray="5 5"
                  strokeLinecap="round"
                />
                {FC_INPUT.map((p) => (
                  <circle
                    key={p.m}
                    cx={fcX(p.m)}
                    cy={fcY(p.v)}
                    r="3.5"
                    fill="var(--panel)"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                ))}
                <line
                  x1={fcX(FC_PRED.m)}
                  x2={fcX(FC_PRED.m)}
                  y1={fcY(FC_PRED.v + FC_PRED.mae)}
                  y2={fcY(FC_PRED.v - FC_PRED.mae)}
                  stroke="var(--primary)"
                  strokeOpacity="0.6"
                />
                <circle
                  cx={fcX(FC_PRED.m)}
                  cy={fcY(FC_PRED.v)}
                  r="9"
                  fill="var(--primary)"
                  className="es-pulse"
                />
                <circle cx={fcX(FC_PRED.m)} cy={fcY(FC_PRED.v)} r="4.5" fill="var(--primary)" />

                {/* agora */}
                <line
                  x1={fcX(0)}
                  x2={fcX(0)}
                  y1={FC.top}
                  y2={FC.h - FC.bottom}
                  stroke="white"
                  strokeOpacity="0.25"
                />
                <text
                  x={fcX(0) + 6}
                  y={FC.top + 10}
                  className="font-data"
                  fontSize="9"
                  fill="white"
                  fillOpacity="0.55"
                >
                  AGORA
                </text>
                <text
                  x={fcX(FC_PRED.m) + 4}
                  y={FC.top + 10}
                  textAnchor="end"
                  className="font-data"
                  fontSize="9"
                  fill="var(--primary)"
                >
                  PREVISÃO
                </text>

                {/* eixo de tempo (min) */}
                {[-15, -10, -5, 0, 30].map((m) => (
                  <text
                    key={m}
                    x={fcX(m)}
                    y={FC.h - 10}
                    textAnchor="middle"
                    className="font-data"
                    fontSize="9"
                    fill={m === 30 ? "var(--primary)" : "white"}
                    fillOpacity={m === 30 ? 1 : 0.35}
                  >
                    {m === 0 ? "t" : m > 0 ? `+${m} min` : m}
                  </text>
                ))}
              </svg>

              <div className="font-data mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-(--panel-line) pt-4 text-[10px] text-white/50">
                <span className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-white" />4 leituras de entrada, de 5 em
                  5 min
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 border-t border-dashed border-primary" />
                  projeção
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-3 rounded-sm bg-primary/30" />± erro médio do sensor
                </span>
              </div>
            </figure>
          </div>

          {/* Avaliação */}
          <div className="mt-24 grid gap-12 border-t border-(--line) pt-14 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
            <div>
              <h3 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[0.95]">
                Medido contra
                <br />
                <em className="text-primary">o óbvio.</em>
              </h3>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-(--ink-soft)">
                O erro é calculado em dados separados por ordem cronológica, que o modelo nunca viu,
                e comparado com a estratégia mais simples: repetir o último valor lido. Com cerca de
                21 horas de coleta, o Ridge supera essa referência no sensor S1 e fica próximo dela
                nos demais. Mais dias de dados, incluindo irrigações, são o próximo passo.
              </p>
              <dl className="mt-8 grid max-w-sm grid-cols-2 gap-px overflow-hidden rounded-2xl border border-(--line) bg-(--line)">
                {[
                  { label: "Ridge", value: 5.41 },
                  { label: "Persistência", value: 4.77 },
                ].map((m) => (
                  <div key={m.label} className="bg-(--paper) p-5">
                    <dt className="font-data text-[10px] tracking-[0.2em] text-(--ink-soft) uppercase">
                      {m.label}
                    </dt>
                    <dd className="font-display mt-2 text-4xl tabular-nums">
                      {formatPt(m.value, 2)}
                      <span className="font-data ml-1.5 text-[10px] text-(--ink-soft)">
                        MAE geral
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <figure>
              <figcaption className="font-data flex flex-wrap items-center justify-between gap-3 text-[10px] tracking-[0.2em] text-(--ink-soft) uppercase">
                <span>Erro médio por sensor · p.p.</span>
                <span className="flex items-center gap-4 tracking-normal normal-case">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-primary" />
                    Ridge
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2 rounded-full bg-(--ink-soft)/40" />
                    Persistência
                  </span>
                </span>
              </figcaption>
              <ul className="mt-6 space-y-5">
                {FORECAST_MAE.map((row) => (
                  <li key={row.id} className="grid grid-cols-[2.5rem_1fr] items-center gap-x-4">
                    <span className="font-data text-xs text-(--ink-soft)">{row.id}</span>
                    <div className="space-y-1.5">
                      {[
                        { value: row.ridge, className: "bg-primary" },
                        { value: row.persistence, className: "bg-(--ink-soft)/35" },
                      ].map((bar, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-(--paper-2)">
                            <div
                              className={`h-full rounded-full ${bar.className}`}
                              style={{ width: `${(bar.value / MAE_MAX) * 100}%` }}
                            />
                          </div>
                          <span className="font-data w-10 text-right text-[11px] text-(--ink-soft) tabular-nums">
                            {formatPt(bar.value, 2)}
                          </span>
                        </div>
                      ))}
                    </div>
                    {row.ridge < row.persistence ? (
                      <span className="font-data col-start-2 mt-1.5 text-[10px] text-primary">
                        Ridge abaixo da persistência
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </section>

        {/* EQUIPE */}
        <section id="equipe" className="scroll-mt-16 bg-(--panel) text-(--panel-ink)">
          <div className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:py-28">
            <div className="flex flex-col justify-between gap-6 border-b border-(--panel-line) pb-10 md:flex-row md:items-end">
              <h2 className="font-display text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">Equipe</h2>
              <div className="text-sm text-white/60 md:text-right">
                <p>Ciência da Computação — Universidade Paulista (UNIP)</p>
                <p className="mt-1">
                  Orientação: <span className="text-white">Prof. Marco Gomes</span>
                </p>
              </div>
            </div>

            <ul className="grid sm:grid-cols-2 lg:grid-cols-4">
              {TEAM.map((member, i) => (
                <li
                  key={member.ra}
                  className="border-b border-(--panel-line) py-8 sm:pr-6 lg:border-b-0 lg:pt-10"
                >
                  <span className="font-data text-[10px] text-white/40">0{i + 1}</span>
                  <p className="font-display mt-3 text-2xl leading-tight">{member.name}</p>
                  <p className="font-data mt-2 text-[11px] text-white/40">RA {member.ra.trim()}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="relative z-10 bg-(--panel) text-(--panel-ink)">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 border-t border-(--panel-line) px-5 py-8 text-xs text-white/50 sm:flex-row sm:items-center sm:px-8">
          <span>EarthSense © 2026 — Trabalho de Conclusão de Curso</span>
          <Link
            to="/auth"
            className="group inline-flex items-center gap-1 text-white transition-opacity hover:opacity-80"
          >
            Acessar a plataforma
            <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
