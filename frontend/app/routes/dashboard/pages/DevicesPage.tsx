import { useState } from "react";
import { Plus, MapPin, Wifi, WifiOff, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import type { Device } from "../types";
import { getSoilStatus, SOIL_STATUS_LABEL, SOIL_STATUS_COLOR } from "../types";

interface DevicesPageProps {
  devices: Device[];
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export function DevicesPage({ devices }: DevicesPageProps) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [formData, setFormData] = useState({ name: "", mac_address: "", location: "" });

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST /api/devices com formData
    toast.add({
      title: "Dispositivo registrado",
      description: `${formData.name} foi adicionado com sucesso.`,
      type: "success",
    });
    setRegisterOpen(false);
    setFormData({ name: "", mac_address: "", location: "" });
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-foreground">Dispositivos</h1>
            <p className="text-xs text-muted-foreground">
              {devices.length} sensor{devices.length !== 1 ? "es" : ""} registrado
              {devices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            className="rounded-full gap-1.5 text-xs h-8"
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            Registrar sensor
          </Button>
        </div>

        {/* Device Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {devices.map((device) => {
            const humidity = device.last_reading?.humidity_pct ?? null;
            const status = humidity !== null ? getSoilStatus(humidity) : null;

            return (
              <div
                key={device.id}
                className="rounded-2xl border border-border/60 bg-card p-5 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-primary/10">
                      <Cpu className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-semibold text-foreground">{device.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        {device.mac_address}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      device.is_online
                        ? "border-emerald-500/30 text-emerald-500 bg-emerald-500/8"
                        : "border-border text-muted-foreground bg-muted/30"
                    }
                  >
                    {device.is_online ? (
                      <Wifi className="w-3 h-3 mr-1" />
                    ) : (
                      <WifiOff className="w-3 h-3 mr-1" />
                    )}
                    {device.is_online ? "Online" : "Offline"}
                  </Badge>
                </div>

                {device.location && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {device.location}
                  </div>
                )}

                {humidity !== null && status ? (
                  <div className="flex items-center justify-between pt-1 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">Última leitura</span>
                    <span className={`text-sm font-bold ${SOIL_STATUS_COLOR[status]}`}>
                      {humidity.toFixed(1)}%
                      <span className="text-xs font-normal text-muted-foreground ml-1">
                        · {SOIL_STATUS_LABEL[status]}
                      </span>
                    </span>
                  </div>
                ) : null}

                {device.last_seen && (
                  <p className="text-[10px] text-muted-foreground/70">
                    Visto: {timeAgo(device.last_seen)}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Register Device Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Registrar novo sensor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="flex flex-col gap-4 mt-1">
            <div className="space-y-1.5">
              <Label
                htmlFor="dev-name"
                className="text-xs text-muted-foreground uppercase tracking-wider font-mono"
              >
                Nome do Sensor
              </Label>
              <Input
                id="dev-name"
                placeholder="Ex: Sensor Talhão C"
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                required
                className="rounded-full"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="dev-mac"
                className="text-xs text-muted-foreground uppercase tracking-wider font-mono"
              >
                MAC Address
              </Label>
              <Input
                id="dev-mac"
                placeholder="AA:BB:CC:DD:EE:FF"
                value={formData.mac_address}
                onChange={(e) => setFormData((p) => ({ ...p, mac_address: e.target.value }))}
                required
                className="rounded-full font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="dev-location"
                className="text-xs text-muted-foreground uppercase tracking-wider font-mono"
              >
                Localização
              </Label>
              <Input
                id="dev-location"
                placeholder="Ex: Talhão D — Trigo"
                value={formData.location}
                onChange={(e) => setFormData((p) => ({ ...p, location: e.target.value }))}
                className="rounded-full"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="ghost"
                className="flex-1 rounded-full"
                onClick={() => setRegisterOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 rounded-full">
                Registrar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
