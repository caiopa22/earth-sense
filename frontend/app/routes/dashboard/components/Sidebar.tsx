import { cn } from "cn";
import { Clock, Cpu, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { useState } from "react";
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col border-r border-border/60 bg-background/80 backdrop-blur-sm transition-[width] duration-200",
        isCollapsed ? "w-16" : "w-56",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex h-14 items-center border-b border-border/60",
          isCollapsed ? "justify-center" : "px-4",
        )}
      >
        {isCollapsed ? <Sparkles className="size-5 text-primary" /> : <Logo className="h-12" />}
      </div>

      {/* Sidebar controls */}
      <div
        className={cn(
          "border-b border-border/60 p-3",
          isCollapsed ? "flex justify-center" : "flex justify-end",
        )}
      >
        <button
          type="button"
          title={isCollapsed ? "Expandir menu" : "Recolher menu"}
          aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          onClick={() => setIsCollapsed((collapsed) => !collapsed)}
          className="flex size-9 items-center justify-center rounded-lg border border-border/70 bg-muted/30 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
        {navItems.map(({ page, icon: Icon, label }) => {
          const isActive = activePage === page;

          return (
            <button
              key={page}
              type="button"
              onClick={() => onNavigate(page)}
              title={isCollapsed ? label : undefined}
              className={cn(
                "flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all",
                isCollapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!isCollapsed && <span className="flex-1">{label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
