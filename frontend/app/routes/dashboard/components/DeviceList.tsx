import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Cpu } from "lucide-react";
import type { Device } from "../types";
import { DeviceCard } from "./DeviceCard";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelect: (id: string) => void;
}

export function DeviceList({ devices, selectedDeviceId, onSelect }: DeviceListProps) {
  if (devices.length === 0) {
    return (
      <Empty className="min-h-[180px] border-border/60 bg-transparent p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Cpu className="w-5 h-5" />
          </EmptyMedia>
          <EmptyTitle>Nenhum sensor cadastrado</EmptyTitle>
        </EmptyHeader>
        <EmptyDescription>
          Cadastre o primeiro dispositivo para começar a acompanhar a umidade do solo.
        </EmptyDescription>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {devices.map((device) => (
        <DeviceCard
          key={device.id}
          device={device}
          isSelected={device.id === selectedDeviceId}
          onClick={() => onSelect(device.id)}
        />
      ))}
    </div>
  );
}
