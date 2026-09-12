import type { Device } from "../types";
import { DeviceCard } from "./DeviceCard";

interface DeviceListProps {
  devices: Device[];
  selectedDeviceId: string;
  onSelect: (id: string) => void;
}

export function DeviceList({ devices, selectedDeviceId, onSelect }: DeviceListProps) {
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
