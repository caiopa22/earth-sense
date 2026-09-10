export interface Device {
  id: string;
  user_id: string;
  name: string;
  mac_address: string;
  location: string | null;
  created_at: string;
  last_seen?: string | null;
}

export interface CreateDeviceInput {
  name: string;
  mac_address: string;
  location?: string | null;
}

export interface UpdateDeviceInput {
  name?: string;
  mac_address?: string;
  location?: string | null;
}
