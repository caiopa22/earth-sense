import { Button } from "@/components/ui/button";
import { BarChart2, Leaf, MessageSquare, Sparkles } from "lucide-react";

const capabilities = [
  {
    icon: BarChart2,
    label: "Análise de tendências",
    description: "Identifica padrões críticos nas séries históricas de umidade.",
  },
  {
    icon: Leaf,
    label: "Classificação do solo",
    description: "Classifica o estado do solo em 5 categorias com 95% de acurácia.",
  },
  {
    icon: MessageSquare,
    label: "Recomendações",
    description: "Gera orientações de irrigação em linguagem natural.",
  },
];

export function EarthAgentPreview({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/3 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-primary/15">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Earth Agent</span>
          </div>
          <span className="text-xs text-muted-foreground">Agente de IA para análise de solo</span>
        </div>
      </div>

      {/* Capabilities */}
      <div className="flex flex-col gap-2.5">
        {capabilities.map(({ icon: Icon, label, description }) => (
          <div key={label} className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-lg bg-background/60 border border-border/50 shrink-0">
              <Icon className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-xs font-medium text-foreground">{label}</span>
              <span className="text-xs text-muted-foreground">{description}</span>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="w-full rounded-full border-primary/30 text-primary text-xs"
        onClick={onOpen}
      >
        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
        Conversar com o Earth Agent
      </Button>
    </div>
  );
}
