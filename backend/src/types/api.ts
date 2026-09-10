export interface ApiErrorResponse {
  error: string;
}

export interface ApiMessageResponse {
  message: string;
}

export interface AuthenticatedUser {
  id: string;
  email?: string | null;
}
