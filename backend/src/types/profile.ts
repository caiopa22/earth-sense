export type ProfileRole = 'user' | 'admin';

export interface Profile {
  id: string;
  name: string;
  email: string;
  role: ProfileRole;
  avatar?: string | null;
  created_at: string;
}

export interface UpdateUserRoleRequestBody {
  role: ProfileRole;
}
