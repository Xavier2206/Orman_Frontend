export type AuthenticatedStatus = 'AUTHENTICATED';

export interface AuthenticatedResponse {
  readonly status: AuthenticatedStatus;
  readonly login: string;
  readonly codper: number;
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly sid: string;
}

export type LoginResponse = AuthenticatedResponse;

export interface LoginRequest {
  readonly login: string;
  readonly password: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly clientType: 'WEB';
}

export interface AuthSession {
  readonly login: string;
  readonly codper: number;
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly sid: string;
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';
