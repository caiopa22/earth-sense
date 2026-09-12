import { Sparkles, MessageSquare, BarChart2, Leaf, Lightbulb, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: BarChart2,
    title: "Análise de Tendências",
    description:
      "O agente interpreta séries temporais de umidade, identificando padrões críticos antes que se tornem problemas.",
  },
  {
    icon: Leaf,
    title: "Classificação do Solo",
    description:
      "Classifica o estado do solo em 5 categorias (Seco → Saturado) com acurácia de 95%, baseado nas leituras do sensor.",
  },
  {
    icon: MessageSquare,
    title: "Linguagem Natural",
    description:
      "Converse com o Earth Agent e receba recomendações de irrigação em português claro, sem jargão técnico.",
  },
  {
    icon: Lightbulb,
    title: "Recomendações Personalizadas",
    description:
      "Gera orientações de manejo adaptadas ao seu dispositivo, cultura e histórico de leituras.",
  },
  {
    icon: Zap,
    title: "Contexto em Tempo Real",
    description:
      "Utiliza RAG (Retrieval-Augmented Generation) para fundamentar respostas nos dados reais dos seus sensores.",
  },
];

export function EarthAgentPage() {
  return (
    <div className="flex flex-col gap-8 p-6 max-w-2xl mx-auto overflow-y-auto">
      {/* Hero */}
      <div className="flex flex-col items-center gap-4 text-center pt-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-3xl bg-primary/15 border border-primary/20 flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-primary" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Badge className="text-[9px] px-1.5 py-0.5 bg-primary/20 text-primary border-primary/30 font-semibold tracking-wide">
              EM BREVE
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Earth Agent</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            Agente de inteligência artificial especializado em análise de solo e recomendações de
            irrigação para a plataforma EarthSense.
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 gap-3">
        {features.map(({ icon: Icon, title, description }) => (
          <div
            key={title}
            className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card p-4"
          >
            <div className="p-2 rounded-xl bg-primary/10 shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{title}</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/3 p-6 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-muted-foreground">
          O Earth Agent estará disponível em breve. Você será notificado quando o agente estiver
          pronto para uso.
        </p>
        <Button disabled className="rounded-full gap-2 cursor-not-allowed opacity-60">
          <Sparkles className="w-4 h-4" />
          Ativar Earth Agent
        </Button>
      </div>
    </div>
  );
}
