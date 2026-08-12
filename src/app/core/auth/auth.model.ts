export type AuthenticatedStatus = 'AUTHENTICATED';
export type OtpRequiredStatus = 'OTP_REQUIRED';

export interface AuthenticatedResponse {
  readonly status: AuthenticatedStatus;
  readonly login: string;
  readonly codper: number;
  readonly accessToken: string;
  readonly tokenType: 'Bearer';
  readonly expiresIn: number;
  readonly sid: string;
}

export interface OtpRequiredResponse {
  readonly status: OtpRequiredStatus;
  readonly challengeId: string;
  readonly expiresIn: number;
}

export type LoginResponse = AuthenticatedResponse | OtpRequiredResponse;

export interface LoginRequest {
  readonly login: string;
  readonly password: string;
  readonly deviceId: string;
  readonly deviceName: string;
  readonly clientType: 'WEB';
}

export interface OtpVerifyRequest {
  readonly challengeId: string;
  readonly code: string;
  readonly deviceId: string;
  readonly deviceName: string;
}

export interface OtpResendRequest {
  readonly challengeId: string;
}

export interface AuthSession {
  readonly login: string;
  readonly codper: number;
  readonly accessToken: string;
  readonly expiresIn: number;
  readonly sid: string;
}

export interface OtpChallenge {
  readonly challengeId: string;
  readonly expiresIn: number;
}

export type AuthState = 'checking' | 'authenticated' | 'unauthenticated';
