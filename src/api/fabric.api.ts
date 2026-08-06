import { httpClient } from './httpClient';
import type { PaginatedResponse } from './machineType.api';

export interface Fabric {
  id: string;
  code: string;
  description: string;
  family: string;
  construction: string;
  composition: string;
  gsm: number;
  thicknessMm: number;
  finish: string;
  shrinkagePct: number;
  supplierId: string | null;
  isActive: boolean;
}

export interface FabricListParams {
  page?: number;
  limit?: number;
  search?: string;
  family?: string;
  isActive?: boolean;
}

export async function listFabrics(
  params: FabricListParams = {},
): Promise<PaginatedResponse<Fabric>> {
  const res = await httpClient.get<PaginatedResponse<Fabric>>('/fabrics', { params });
  return res.data;
}

export async function getFabric(id: string): Promise<Fabric> {
  const res = await httpClient.get<Fabric>(`/fabrics/${id}`);
  return res.data;
}

export interface FabricInput {
  code: string;
  description: string;
  family: string;
  construction: string;
  composition: string;
  gsm: number;
  thicknessMm: number;
  finish: string;
  shrinkagePct: number;
}

export async function createFabric(input: FabricInput): Promise<Fabric> {
  const res = await httpClient.post<Fabric>('/fabrics', input);
  return res.data;
}

export async function updateFabric(id: string, input: Partial<FabricInput>): Promise<Fabric> {
  const res = await httpClient.patch<Fabric>(`/fabrics/${id}`, input);
  return res.data;
}

export async function setFabricActive(id: string, isActive: boolean): Promise<Fabric> {
  const res = await httpClient.post<Fabric>(
    `/fabrics/${id}/${isActive ? 'reactivate' : 'deactivate'}`,
  );
  return res.data;
}
