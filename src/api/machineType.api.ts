import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';

export interface ThreadLineTemplateEntry {
  role: ThreadLineRole;
  included: boolean;
  defaultCount: number;
  defaultFactor: number;
}

export interface MachineType {
  id: string;
  code: string;
  name: string;
  stitchClass: string;
  family: string;
  threadLineTemplate: ThreadLineTemplateEntry[];
  isActive: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface MachineTypeListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export async function listMachineTypes(
  params: MachineTypeListParams = {},
): Promise<PaginatedResponse<MachineType>> {
  const res = await httpClient.get<PaginatedResponse<MachineType>>('/machine-types', { params });
  return res.data;
}

export async function getMachineType(id: string): Promise<MachineType> {
  const res = await httpClient.get<MachineType>(`/machine-types/${id}`);
  return res.data;
}

export interface MachineTypeInput {
  code: string;
  name: string;
  stitchClass: string;
  family: string;
  threadLineTemplate: ThreadLineTemplateEntry[];
}

export async function createMachineType(input: MachineTypeInput): Promise<MachineType> {
  const res = await httpClient.post<MachineType>('/machine-types', input);
  return res.data;
}

export async function updateMachineType(
  id: string,
  input: Partial<MachineTypeInput>,
): Promise<MachineType> {
  const res = await httpClient.patch<MachineType>(`/machine-types/${id}`, input);
  return res.data;
}

export async function setMachineTypeActive(id: string, isActive: boolean): Promise<MachineType> {
  const res = await httpClient.post<MachineType>(
    `/machine-types/${id}/${isActive ? 'reactivate' : 'deactivate'}`,
  );
  return res.data;
}

export interface MachineTypeUsage {
  styles: number;
  operations: number;
  estimates: number;
}

export async function getMachineTypeUsage(id: string): Promise<MachineTypeUsage> {
  const res = await httpClient.get<MachineTypeUsage>(`/machine-types/${id}/usage`);
  return res.data;
}
