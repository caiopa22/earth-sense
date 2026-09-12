import type { Route } from "./+types/home";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Activity } from "lucide-react";

// Componentes Shadcn UI (Certifique-se de instalá-los via CLI do shadcn)
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TEAM } from "~/lib/constants";
import Logo from "~/components/ui/logo";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "EarthSense — Apresentação TCC | Ciência da Computação UNIP" },
    { name: "description", content: "Monitoramento de Umidade do Solo via IoT e IA - Projeto de Conclusão de Curso UNIP 2026" },
  ];
}

const METRICS = [
  { value: "±2,8%", label: "Erro Médio Calibrado", highlight: "text-primary" },
  { value: "380ms", label: "Tempo de Resposta API", highlight: "text-foreground" },
  { value: "< R$ 150", label: "Custo de Hardware", highlight: "text-amber-400" },
];

const PILLARS = [
  {
    step: "Pilar 01 • Camada de Sensoriamento",
    title: "Arquitetura Embarcada (IoT)",
    description: (
      <>
        Microcontrolador <strong className="text-foreground font-medium">ESP32 SoC</strong> com processador dual-core integrado ao <strong className="text-foreground font-medium">Sensor Capacitivo de Umidade v1.2</strong> sem corrosão galvânica. Medição dielétrica estável por conversor ADC de 12 bits e amostragem configurada a cada 30 segundos.
      </>
    ),
    tags: ["GPIO34 ADC", "Calibração Polinomial", "Deep Sleep <10µA", "Custo < R$ 150"],
    specs: [
      { label: "Resolução ADC", value: "12 bits (4096)", highlight: false, isHeader: false },
      { label: "Calibração Solo", value: "3500 / 1500", highlight: false, isHeader: false },
      { label: "Erro Médio", value: "±2,8%", highlight: true, isHeader: false },
      { label: "Consumo", value: "Bateria 18650", highlight: false, isHeader: false },
    ]
  },
  {
    step: "Pilar 02 • Camada Cognitiva",
    title: "Earth Agent (LLM)",
    description: (
      <>
        Interpretação agronômica avançada e suporte autônomo à decisão de irrigação. Modelo treinado com <strong className="text-foreground font-medium">Retrieval-Augmented Generation (RAG)</strong> categorizando 5 faixas fenológicas de solo com <strong className="text-foreground font-medium">95% de acurácia</strong> validada.
      </>
    ),
    tags: ["95% Acurácia", "RAG Dinâmico", "5 Faixas de Solo", "19/20 Validações"],
    specs: [
      { label: "PARECER EM TEMPO REAL", value: "99,4% CONF.", highlight: true, isHeader: true },
    ],
    quote: '"Umidade estável em 42,8% (Latossolo Bruno). Capacidade de campo atendida. Dispensar irrigação por 12h."'
  },
  {
    step: "Pilar 03 • Persistência & Interface",
    title: "Nuvem Supabase & React",
    description: (
      <>
        API RESTful com banco de dados <strong className="text-foreground font-medium">PostgreSQL via Supabase</strong>, políticas <strong className="text-foreground font-medium">Row Level Security (RLS)</strong> e telemetria analítica em tempo real construída com React 18 e TypeScript.
      </>
    ),
    tags: ["PostgreSQL 15", "RLS Multi-tenant", "React + Vite", "380ms Latência"],
    specs: [
      { label: "Entrega Pacotes", value: "100% (100/100)", highlight: true, isHeader: false },
      { label: "Segurança RLS", value: "Validada (CT08)", highlight: false, isHeader: false },
      { label: "Taxa Refresh", value: "~1,2 s", highlight: false, isHeader: false },
      { label: "Hospedagem", value: "Vercel + GitHub", highlight: false, isHeader: false },
    ]
  }
];

export default function Home() {

  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-xl border-b">
        <div className="max-w-6xl mx-auto px-6 h-18 flex items-center justify-between py-4">
          <Link to="/" className="flex items-center gap-3 group">
            <Logo />
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle className="rounded-full border-border bg-background/80 shadow-sm" />
            <Button
              className="rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-all px-4 py-2 text-sm font-medium inline-flex items-center justify-center gap-2 shadow-xs"
              onClick={() => navigate("/auth")}
            >
              Acessar Plataforma
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative min-h-145 pt-32 pb-20 overflow-hidden flex items-center border-b">
        {/* Background Image & Overlays */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCza3MRwSaU7oTgX0NQ2c03Ef8b41P51goqAVltAl-g_njQikt4fIqH6WorOnwbktDUHdZhkzcbDJ3J60v4MKtTQQvMJ1mK1lv2mk9t7Yn9Vq682wt9XGNy7c9EcnrSOaGzNUTXo5aoEDJDpSyeH4t4H_WZ4g-fYM0jLWmby9bYVSvJciygNIHp36vFC_QFXvaj-nThyKDbp6ba-7h_VBg3NvlSG0y0V9ReZJvPhINaQCROgBW6zKUdtw"
            alt="Campo agrícola com irrigação de precisão"
            className="w-full h-full object-cover opacity-20 filter brightness-110 contrast-125 scale-105"
          />
          <div className="absolute inset-0 bbg-linear-to-t from-background via-background/70 to-transparent" />
          <div className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-transparent" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-6 w-full">
          <div className="max-w-5xl space-y-6 text-left">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-mono text-xs rounded-full py-1 px-3">
              <span className="relative flex h-2 w-2 mr-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Plataforma EarthSense · TCC Ciência da Computação
            </Badge>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.08] max-w-5xl">
              Monitoramento de Umidade do Solo via <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent italic font-light">IoT e IA</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground font-light leading-relaxed max-w-2xl pt-2">
              Apresentação do Trabalho de Conclusão de Curso (TCC) — Plataforma integrada com ESP32, sensoriamento capacitivo e agente de inteligência artificial.
            </p>

            {/* Metrics */}
            <div className="pt-8">
              <div className="flex flex-wrap items-baseline gap-8 sm:gap-12 md:gap-16 pt-6">
                {METRICS.map((metric, i) => (
                  <div key={i} className="flex gap-8 sm:gap-12 items-center">
                    <div className="space-y-1">
                      <div className={`text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight font-mono ${metric.highlight}`}>
                        {metric.value}
                      </div>
                      <div className="text-xs sm:text-sm text-muted-foreground tracking-wide uppercase">
                        {metric.label}
                      </div>
                    </div>
                    {i !== METRICS.length - 1 && (
                      <div className="hidden sm:block w-px h-12 bg-border self-center" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS SECTION: Arquitetura */}
      <section className="py-24 bg-card/30 relative border-b" id="arquitetura">
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-16 text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono uppercase tracking-widest text-primary font-semibold block mb-2">
              Engenharia em Camadas
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
              Destaques da Arquitetura do Sistema
            </h2>
            <p className="text-muted-foreground mt-3 text-base font-light leading-relaxed">
              Três pilares fundamentais projetados para garantir baixo custo, alta precisão sensorial e suporte autônomo à decisão agronômica.
            </p>
          </div>

          <div className="space-y-8">
            {PILLARS.map((pillar, idx) => (
              <Card key={idx} className="bg-card/50 backdrop-blur-md border-border hover:border-primary/30 transition-all duration-300">
                <CardContent className="p-8 md:p-10">
                  <div className="grid md:grid-cols-12 gap-8 items-center">

                    {/* Coluna de Texto Principal */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="inline-flex items-center gap-2 text-xs font-mono text-primary font-semibold">
                        <span className="w-2 h-2 rounded-full bg-primary"></span>
                        {pillar.step}
                      </div>
                      <h3 className="text-2xl font-bold text-foreground tracking-tight">
                        {pillar.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed font-light text-sm md:text-base">
                        {pillar.description}
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2">
                        {pillar.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="font-mono text-xs text-muted-foreground font-normal">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Coluna de Especificações */}
                    <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-8 space-y-2.5 font-mono text-xs text-muted-foreground">
                      {pillar.specs.map((spec, i) => (
                        <div key={i} className={`flex justify-between py-1 ${i !== pillar.specs.length - 1 && !spec.isHeader ? 'border-b border-border' : ''}`}>
                          <span className={spec.isHeader ? "text-[11px] text-primary font-semibold" : ""}>
                            {spec.label}
                          </span>
                          <span className={`font-semibold ${spec.highlight ? 'text-primary font-bold' : 'text-foreground'}`}>
                            {spec.value}
                          </span>
                        </div>
                      ))}

                      {/* Quote Condicional (Usado no Agent LLM) */}
                      {pillar.quote && (
                        <p className="text-foreground/80 font-light italic leading-relaxed text-xs border-l-2 border-primary pl-3 py-2 bg-muted/30 rounded-r-md mt-2">
                          {pillar.quote}
                        </p>
                      )}
                    </div>

                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ACADEMIC CREDITS SECTION */}
      <section className="bg-background relative py-12" id="equipe">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-border mb-8">
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-primary block mb-1">
                Projeto de Graduação · TCC
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Autores & Orientação</h2>
              <p className="text-xs text-muted-foreground font-light mt-0.5">
                Ciência da Computação — UNIP Marquês de São Vicente • 2026
              </p>
            </div>
            <Badge variant="outline" className="px-3 py-1.5 font-mono text-xs rounded-full self-start md:self-auto border-border">
              <span className="text-muted-foreground mr-1">Orientador:</span>
              <span className="text-primary font-medium">Prof. Marco Gomes</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {TEAM.map((member) => (
              <div key={member.ra} className="space-y-1">
                <p className="text-sm font-medium text-foreground tracking-tight">{member.name}</p>
                <span className="inline-block text-[11px] font-mono text-primary/90">RA: {member.ra}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 border-t border-border bg-background text-center text-xs text-muted-foreground">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span>EarthSense © 2026 — Projeto Acadêmico de Ciência da Computação | UNIP</span>
          </div>
          <div className="font-mono text-[11px]">
            Desenvolvimento & Validação de Protótipo Funcional
          </div>
        </div>
      </footer>
    </div>
  );
}