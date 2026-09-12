import { cn } from "cn";
import { LayoutDashboard, Cpu, Clock, Sparkles } from "lucide-react";
import Logo from "~/components/ui/logo";
import type { DashboardPage } from "../hooks/useDashboard";

interface SidebarProps {
  activePage: DashboardPage;
  onNavigate: (page: DashboardPage) => void;
}

const navItems: { page: DashboardPage; icon: typeof LayoutDashboard; label: string }[] = [
  { page: "overview", icon: LayoutDashboard, label: "Visão Geral" },
  { page: "devices", icon: Cpu, label: "Dispositivos" },
  { page: "history", icon: Clock, label: "Histórico" },
  { page: "agent", icon: Sparkles, label: "Earth Agent" },
];

export function Sidebar({ activePage, onNavigate }: SidebarProps) {
  return (
    <aside className="w-56 shrink-0 border-r border-border/60 flex flex-col bg-background/80 backdrop-blur-sm h-full">
      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-border/60">
        <Logo className="h-6" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {navItems.map(({ page, icon: Icon, label }) => {
          const isActive = activePage === page;
          const isComingSoon = page === "agent";

          return (
            <button
              key={page}
              type="button"
              onClick={() => !isComingSoon && onNavigate(page)}
              disabled={isComingSoon}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all w-full text-left",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                isComingSoon && "opacity-50 cursor-not-allowed",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1">{label}</span>
              {isComingSoon && (
                <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/60 border border-border/50 rounded px-1 py-0.5">
                  Em breve
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/60">
        <p className="text-[10px] text-muted-foreground/60 text-center leading-relaxed">
          EarthSense IoT & IA
          <br />
          UNIP TCC 2026
        </p>
      </div>
    </aside>
  );
}
