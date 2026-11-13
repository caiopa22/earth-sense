import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Device } from "../types";

interface DeviceSelectProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelect: (id: string) => void;
}

export function DeviceSelect({ devices, selectedDeviceId, onSelect }: DeviceSelectProps) {
  const items = devices.map((device) => ({ value: device.id, label: device.name }));
  const hasSelected = devices.some((device) => device.id === selectedDeviceId);

  return (
    <Select
      items={items}
      value={hasSelected ? selectedDeviceId : null}
      onValueChange={(value) => {
        if (value) onSelect(value);
      }}
    >
      <SelectTrigger className="w-56" aria-label="Dispositivo">
        <SelectValue placeholder="Selecione um dispositivo" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Dispositivos</SelectLabel>
          {devices.map((device) => (
            <SelectItem key={device.id} value={device.id}>
              {device.name}
              {device.location ? (
                <span className="text-muted-foreground">{device.location}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
