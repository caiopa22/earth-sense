export type ProfileRole = 'user' | 'admin';

export interface Profile {
  id: string;
  email: string;
  role: ProfileRole;
  created_at: string;
}

export interface UpdateUserRoleRequestBody {
  role: ProfileRole;
}
