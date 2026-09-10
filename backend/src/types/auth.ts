export interface LoginRequestBody {
  email: string;
  password: string;
}

export interface SignupRequestBody {
  email: string;
  password: string;
  name: string;
}

export interface RefreshTokenRequestBody {
  refreshToken: string;
}
