import { httpClient } from './httpClient';
import type { PaginatedResponse } from './machineType.api';

export const STYLE_STATUSES = [
  'Draft',
  'Estimating',
  'Submitted',
  'Approved',
  'In Production',
  'Closed',
  'Cancelled',
] as const;
export type StyleStatus = (typeof STYLE_STATUSES)[number];

export interface Colourway {
  id: string;
  name: string;
  shadeCode: string;
}

export interface FabricMapping {
  id: string;
  fabricId: string;
  placement: string;
}

export interface Style {
  id: string;
  styleNo: string;
  name: string;
  buyerId: string;
  seasonId: string;
  styleTypeId: string;
  orderQty: number;
  sizeRange: string[];
  midSize: string;
  targetDeliveryDate: string | null;
  colourways: Colourway[];
  fabrics: FabricMapping[];
  status: StyleStatus;
  createdBy: string;
}

export interface StyleListParams {
  page?: number;
  limit?: number;
  search?: string;
  buyerId?: string;
  seasonId?: string;
  styleTypeId?: string;
  status?: StyleStatus;
}

export async function listStyles(params: StyleListParams = {}): Promise<PaginatedResponse<Style>> {
  const res = await httpClient.get<PaginatedResponse<Style>>('/styles', { params });
  return res.data;
}

export async function getStyle(id: string): Promise<Style> {
  const res = await httpClient.get<Style>(`/styles/${id}`);
  return res.data;
}

export interface StyleInput {
  styleNo: string;
  name: string;
  buyerId: string;
  seasonId: string;
  styleTypeId: string;
  orderQty: number;
  sizeRange: string[];
  midSize: string;
  targetDeliveryDate?: string;
}

export async function createStyle(input: StyleInput): Promise<Style> {
  const res = await httpClient.post<Style>('/styles', input);
  return res.data;
}

export interface StyleUpdateInput {
  name?: string;
  orderQty?: number;
  sizeRange?: string[];
  midSize?: string;
  targetDeliveryDate?: string | null;
  status?: StyleStatus;
}

export async function updateStyle(id: string, input: StyleUpdateInput): Promise<Style> {
  const res = await httpClient.patch<Style>(`/styles/${id}`, input);
  return res.data;
}

export interface DuplicateStyleInput {
  styleNo: string;
  name?: string;
  buyerId?: string;
  seasonId?: string;
  orderQty?: number;
}

export async function duplicateStyle(id: string, input: DuplicateStyleInput): Promise<Style> {
  const res = await httpClient.post<Style>(`/styles/${id}/duplicate`, input);
  return res.data;
}

export async function addColourway(
  styleId: string,
  input: { name: string; shadeCode: string },
): Promise<Style> {
  const res = await httpClient.post<Style>(`/styles/${styleId}/colourways`, input);
  return res.data;
}

export async function updateColourway(
  styleId: string,
  colourwayId: string,
  input: { name?: string; shadeCode?: string },
): Promise<Style> {
  const res = await httpClient.patch<Style>(`/styles/${styleId}/colourways/${colourwayId}`, input);
  return res.data;
}

export async function removeColourway(styleId: string, colourwayId: string): Promise<Style> {
  const res = await httpClient.delete<Style>(`/styles/${styleId}/colourways/${colourwayId}`);
  return res.data;
}

export async function addFabricMapping(
  styleId: string,
  input: { fabricId: string; placement: string },
): Promise<Style> {
  const res = await httpClient.post<Style>(`/styles/${styleId}/fabrics`, input);
  return res.data;
}

export async function removeFabricMapping(styleId: string, mappingId: string): Promise<Style> {
  const res = await httpClient.delete<Style>(`/styles/${styleId}/fabrics/${mappingId}`);
  return res.data;
}
