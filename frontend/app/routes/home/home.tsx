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
        "Protótipo de monitoramento periódico da umidade do solo com ESP32, API Node.js, Supabase e Earth Agent (Google Gemini). TCC de Ciência da Computação — UNIP 2026.",
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
  for (let t = 0; t < POINTS; t++) {
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
  const values = seriesFor(s, i);
  return { ...s, path: toPath(values), last: values[values.length - 1] };
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
    title: "Leitura",
    where: "React 19 · Google Gemini",
    body: "O dashboard desenha uma série por sensor e o Earth Agent responde perguntas em linguagem natural usando as leituras recentes como contexto.",
  },
];

const STACK = [
  "ESP32",
  "Node.js",
  "Express 5",
  "TypeScript",
  "Supabase",
  "PostgreSQL",
  "React 19",
  "Gemini",
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
            <a href="#agente" className="transition-colors hover:text-(--ink)">
              Earth Agent
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
              transforma a série histórica em gráficos e respostas em linguagem natural.
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
                </li>
              ))}
            </ul>

            <figcaption className="mt-5 text-[11px] leading-relaxed text-white/40">
              Série ilustrativa no padrão observado no TCC: variação lenta à noite, queda sob sol,
              estabilização dos sensores S1 e S4 na sombra.
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
              Quatro etapas, cada uma com uma responsabilidade clara. O caminho de uma leitura,
              desde o momento em que é medida no campo até aparecer no dashboard.
            </p>
          </div>

          <ol className="mt-16 grid gap-x-10 md:grid-cols-2 lg:grid-cols-4">
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

        {/* EARTH AGENT */}
        <section id="agente" className="mx-auto max-w-7xl scroll-mt-20 px-5 py-24 sm:px-8 lg:py-32">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center lg:gap-20">
            <div>
              <p className="font-data text-[11px] tracking-[0.2em] text-(--ink-soft) uppercase">
                Earth Agent · Google Gemini
              </p>
              <h2 className="font-display mt-5 text-[clamp(2.4rem,5vw,4rem)] leading-[0.95]">
                Pergunte ao solo
                <br />
                <em className="text-primary">em português.</em>
              </h2>
              <p className="mt-8 max-w-md leading-relaxed text-(--ink-soft)">
                Em vez de interpretar curvas sozinho, o usuário conversa com um agente que recebe as
                leituras recentes do dispositivo como contexto e explica o que está acontecendo em
                cada sensor.
              </p>
            </div>

            <div className="space-y-4">
              <div className="ml-auto max-w-sm rounded-3xl rounded-br-md bg-(--ink) px-5 py-4 text-sm text-(--paper)">
                Qual sensor perdeu mais umidade durante a tarde?
              </div>
              <div className="max-w-md rounded-3xl rounded-bl-md border border-(--line) bg-(--paper-2) px-5 py-4 text-sm leading-relaxed">
                <p className="font-data mb-2 text-[10px] tracking-[0.2em] text-primary uppercase">
                  Earth Agent
                </p>
                O <strong className="font-semibold">S3</strong> teve a maior queda no período de
                sol. Já o <strong className="font-semibold">S1</strong> e o{" "}
                <strong className="font-semibold">S4</strong> se estabilizaram depois das 13h, o que
                é compatível com a volta da sombra sobre esses pontos.
              </div>
              <p className="font-data pl-1 text-[10px] text-(--ink-soft)">Exemplo de interação</p>
            </div>
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
