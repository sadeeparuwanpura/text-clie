import { httpClient } from './httpClient';
import type { Permission } from '../types/permission';
import type { SessionUser } from '../store/session.store';

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
  permissions: Permission[];
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await httpClient.post<LoginResponse>('/auth/login', { email, password });
  return res.data;
}

export async function refresh(): Promise<{ accessToken: string }> {
  const res = await httpClient.post<{ accessToken: string }>('/auth/refresh');
  return res.data;
}

export async function logout(): Promise<void> {
  await httpClient.post('/auth/logout');
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const res = await httpClient.post<{ message: string }>('/auth/forgot-password', { email });
  return res.data;
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await httpClient.post<{ message: string }>('/auth/reset-password', {
    token,
    newPassword,
  });
  return res.data;
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  const res = await httpClient.post<{ message: string }>('/auth/change-password', {
    currentPassword,
    newPassword,
  });
  return res.data;
}

export interface MeResponse extends SessionUser {
  permissions: Permission[];
}

export async function me(): Promise<MeResponse> {
  const res = await httpClient.get<MeResponse>('/auth/me');
  return res.data;
}
