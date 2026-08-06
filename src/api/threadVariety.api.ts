import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';
import type { PaginatedResponse } from './machineType.api';

export interface ThreadVariety {
  id: string;
  code: string;
  name: string;
  construction: string;
  fibre: string;
  recommendedRoles: ThreadLineRole[];
  supplierId: string | null;
  isActive: boolean;
}

export interface ThreadVarietyListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function listThreadVarieties(
  params: ThreadVarietyListParams = {},
): Promise<PaginatedResponse<ThreadVariety>> {
  const res = await httpClient.get<PaginatedResponse<ThreadVariety>>('/thread-varieties', {
    params,
  });
  return res.data;
}

export async function getThreadVariety(id: string): Promise<ThreadVariety> {
  const res = await httpClient.get<ThreadVariety>(`/thread-varieties/${id}`);
  return res.data;
}

export interface ThreadVarietyInput {
  code: string;
  name: string;
  construction: string;
  fibre: string;
  recommendedRoles: ThreadLineRole[];
}

export async function createThreadVariety(input: ThreadVarietyInput): Promise<ThreadVariety> {
  const res = await httpClient.post<ThreadVariety>('/thread-varieties', input);
  return res.data;
}

export async function updateThreadVariety(
  id: string,
  input: Partial<ThreadVarietyInput>,
): Promise<ThreadVariety> {
  const res = await httpClient.patch<ThreadVariety>(`/thread-varieties/${id}`, input);
  return res.data;
}

export async function setThreadVarietyActive(
  id: string,
  isActive: boolean,
): Promise<ThreadVariety> {
  const res = await httpClient.post<ThreadVariety>(
    `/thread-varieties/${id}/${isActive ? 'reactivate' : 'deactivate'}`,
  );
  return res.data;
}
