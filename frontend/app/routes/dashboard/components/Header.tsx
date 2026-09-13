import { useState } from "react";
import { LogOut, Settings, User, Bell } from "lucide-react";
import { useNavigate } from "react-router";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import type { Profile, DashboardAlert } from "../types";

interface HeaderProps {
  profile: Profile;
  alerts: DashboardAlert[];
}

export function Header({ profile, alerts }: HeaderProps) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  const unreadAlerts = alerts.filter((a) => a.severity === "critical").length;

  const handleLogout = () => {
    setLogoutOpen(false);
    toast.add({
      title: "Sessão encerrada",
      description: "Você saiu da plataforma com segurança.",
      type: "success",
    });
    setTimeout(() => navigate("/auth"), 600);
  };

  const initials = profile.name
    ? profile.name
        .split(" ")
        .slice(0, 2)
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : profile.email[0].toUpperCase();

  return (
    <>
      <header className="h-14 shrink-0 border-b border-border/60 flex items-center px-4 gap-3 bg-background/80 backdrop-blur-sm">
        <div className="flex-1" />

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative rounded-full w-8 h-8">
          <Bell className="w-4 h-4" />
          {unreadAlerts > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-red-500 text-[9px] text-white flex items-center justify-center font-bold">
              {unreadAlerts}
            </span>
          )}
        </Button>

        <ThemeToggle className="rounded-full w-8 h-8" />

        {/* Avatar */}
        <button
          type="button"
          onClick={() => setProfileOpen(true)}
          className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-xs font-bold text-primary hover:bg-primary/30 transition-colors cursor-pointer"
        >
          {initials}
        </button>
      </header>

      {/* Profile Modal */}
      <Dialog open={profileOpen} onOpenChange={setProfileOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Perfil</DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-3 mt-1">
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-lg font-bold text-primary">
              {initials}
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">
                {profile.name ?? "Usuário"}
              </span>
              <span className="text-xs text-muted-foreground">{profile.email}</span>
            </div>
          </div>

          <Separator className="my-1" />

          <div className="flex flex-col gap-1.5">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm rounded-xl"
              disabled
            >
              <Settings className="w-4 h-4" />
              Configurações da conta
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm rounded-xl text-red-500 hover:text-red-500 hover:bg-red-500/10"
              onClick={() => {
                setProfileOpen(false);
                setLogoutOpen(true);
              }}
            >
              <LogOut className="w-4 h-4" />
              Sair da plataforma
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Logout Confirm Modal */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Confirmar saída</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Deseja encerrar sua sessão na plataforma EarthSense?
          </p>
          <div className="flex gap-2 mt-2 justify-end">
            <Button variant="ghost" className="rounded-full" onClick={() => setLogoutOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" className="rounded-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1.5" />
              Sair
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
