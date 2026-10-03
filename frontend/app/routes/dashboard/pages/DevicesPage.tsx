import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import axios from "axios";
import { Cpu, MapPin, Pencil, Plus, Trash2, Wifi, WifiOff } from "lucide-react";
import { useState } from "react";
import type { Device } from "../types";
import { getSoilStatus, SOIL_STATUS_COLOR, SOIL_STATUS_LABEL } from "../types";

interface DevicesPageProps {
  devices: Device[];
  onCreateDevice: (payload: {
    name: string;
    mac_address: string;
    location?: string;
    sensor_count: number;
  }) => Promise<void>;
  onUpdateDevice: (
    id: string,
    payload: {
      name: string;
      mac_address: string;
      location?: string;
      sensor_count: number;
    },
  ) => Promise<void>;
  onDeleteDevice: (id: string) => Promise<void>;
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s atrás`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  return `${Math.floor(diff / 3600)}h atrás`;
}

export function DevicesPage({
  devices,
  onCreateDevice,
  onUpdateDevice,
  onDeleteDevice,
}: DevicesPageProps) {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [deletingDevice, setDeletingDevice] = useState<Device | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    mac_address: "",
    location: "",
    sensor_count: "1",
  });

  const isEditing = editingDevice !== null;

  const openCreate = () => {
    setEditingDevice(null);
    setFormData({ name: "", mac_address: "", location: "", sensor_count: "1" });
    setRegisterOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      name: device.name,
      mac_address: device.mac_address,
      location: device.location ?? "",
      sensor_count: String(device.sensor_count ?? 1),
    });
    setRegisterOpen(true);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        mac_address: formData.mac_address.trim(),
        location: formData.location.trim() || undefined,
        sensor_count: Number(formData.sensor_count),
      };

      if (editingDevice) {
        await onUpdateDevice(editingDevice.id, payload);
      } else {
        await onCreateDevice(payload);
      }
      toast.add({
        title: editingDevice ? "Dispositivo atualizado" : "Dispositivo registrado",
        description: `${formData.name} foi salvo com sucesso.`,
        type: "success",
      });
      setRegisterOpen(false);
      setFormData({ name: "", mac_address: "", location: "", sensor_count: "1" });
      setEditingDevice(null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : "Não foi possível registrar o dispositivo.";
      toast.add({
        title: "Falha ao registrar",
        description: message ?? "Verifique os dados e tente novamente.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingDevice) return;

    setIsSubmitting(true);
    try {
      await onDeleteDevice(deletingDevice.id);
      toast.add({
        title: "Dispositivo excluído",
        description: `${deletingDevice.name} e suas leituras foram removidos.`,
        type: "success",
      });
      setDeletingDevice(null);
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.error
        : "Não foi possível excluir o dispositivo.";
      toast.add({
        title: "Falha ao excluir",
        description: message ?? "Tente novamente.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-lg font-semibold text-foreground">Dispositivos</h1>
            <p className="text-xs text-muted-foreground">
              {devices.length} dispositivo{devices.length !== 1 ? "s" : ""} registrado
              {devices.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button className="rounded-full gap-1.5 text-xs h-8" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5" />
            Registrar sensor
          </Button>
        </div>

        {/* Device Grid */}
        {devices.length === 0 ? (
          <Empty className="min-h-80 border-border/60 bg-card/30">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Cpu className="w-5 h-5" />
              </EmptyMedia>
              <EmptyTitle>Nenhum sensor por aqui ainda</EmptyTitle>
            </EmptyHeader>
            <EmptyDescription>
              Registre o seu primeiro dispositivo para começar a monitorar a umidade do solo.
            </EmptyDescription>
          </Empty>
        ) : (
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
                    <div className="flex items-center gap-1 shrink-0">
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
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${device.name}`}
                        onClick={() => openEdit(device)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Excluir ${device.name}`}
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingDevice(device)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
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
        )}
      </div>

      {/* Register Device Modal */}
      <Dialog open={registerOpen} onOpenChange={setRegisterOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              {isEditing ? "Editar dispositivo" : "Registrar novo sensor"}
            </DialogTitle>
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
                htmlFor="dev-sensor-count"
                className="text-xs text-muted-foreground uppercase tracking-wider font-mono"
              >
                Quantidade de sensores
              </Label>
              <Input
                id="dev-sensor-count"
                type="number"
                min={1}
                max={32}
                value={formData.sensor_count}
                onChange={(e) => setFormData((p) => ({ ...p, sensor_count: e.target.value }))}
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
                required
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
              <Button type="submit" className="flex-1 rounded-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : isEditing ? "Salvar alterações" : "Registrar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deletingDevice !== null}
        onOpenChange={(open) => !open && setDeletingDevice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir dispositivo?</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingDevice?.name} e todas as leituras associadas serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/80"
              onClick={handleDelete}
            >
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
