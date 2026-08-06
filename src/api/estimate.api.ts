import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';

export const ESTIMATE_STATUSES = [
  'Draft',
  'Submitted',
  'Approved',
  'Rejected',
  'Superseded',
  'Archived',
] as const;
export type EstimateStatus = (typeof ESTIMATE_STATUSES)[number];

export interface CalcTotals {
  perGarmentM: number;
  orderM: number;
  cones: number;
  cost: number;
  costPerGarment: number;
}

export interface Estimate {
  id: string;
  styleId: string;
  version: number;
  status: EstimateStatus;
  wastagePct: number;
  currency: string;
  totals: CalcTotals | null;
  calculatedAt: string | null;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  createdBy: string;
}

export interface CalcLine {
  operationId: string;
  operationName: string;
  machineTypeCode: string;
  stitchClass: string;
  role: ThreadLineRole;
  count: number;
  factor: number;
  spi: number;
  seamM: number;
  metresPerGarment: number;
  orderMetres: number;
  cones: number;
  cost: number;
}

export interface CalcRoleTotal {
  role: ThreadLineRole;
  metresPerGarment: number;
  orderMetres: number;
  coneLengthM: number;
  cones: number;
  unitPrice: number;
  cost: number;
}

export interface CalcResult {
  lines: CalcLine[];
  roleTotals: CalcRoleTotal[];
  totals: CalcTotals;
  unassignedRoles: ThreadLineRole[];
}

export async function calculatePreview(styleId: string, wastagePct?: number): Promise<CalcResult> {
  const res = await httpClient.post<CalcResult>(`/styles/${styleId}/estimates/calculate`, {
    wastagePct,
  });
  return res.data;
}

export async function saveDraftEstimate(styleId: string, wastagePct?: number): Promise<Estimate> {
  const res = await httpClient.post<Estimate>('/estimates', { styleId, wastagePct });
  return res.data;
}

export async function listEstimatesForStyle(styleId: string): Promise<Estimate[]> {
  const res = await httpClient.get<Estimate[]>(`/styles/${styleId}/estimates`);
  return res.data;
}

export async function getEstimate(id: string): Promise<Estimate> {
  const res = await httpClient.get<Estimate>(`/estimates/${id}`);
  return res.data;
}

export async function submitEstimate(id: string): Promise<Estimate> {
  const res = await httpClient.post<Estimate>(`/estimates/${id}/submit`);
  return res.data;
}

export async function recallEstimate(id: string): Promise<Estimate> {
  const res = await httpClient.post<Estimate>(`/estimates/${id}/recall`);
  return res.data;
}

export async function approveEstimate(id: string): Promise<Estimate> {
  const res = await httpClient.post<Estimate>(`/estimates/${id}/approve`);
  return res.data;
}

export async function rejectEstimate(id: string, reason: string): Promise<Estimate> {
  const res = await httpClient.post<Estimate>(`/estimates/${id}/reject`, { reason });
  return res.data;
}

export async function reviseEstimate(id: string): Promise<Estimate> {
  const res = await httpClient.post<Estimate>(`/estimates/${id}/revise`);
  return res.data;
}

export interface SheetRoleSummary {
  role: ThreadLineRole;
  metresPerGarment: number;
  orderMetres: number;
  coneLengthM: number;
  cones: number;
  unitPrice: number;
  cost: number;
  pctOfTotalMetres: number;
}

export interface SheetOperationDetail {
  operationId: string;
  name: string;
  machineTypeCode: string;
  machineTypeName: string;
  stitchClass: string;
  seamM: number;
  spi: number;
  threadLines: Array<{
    role: ThreadLineRole;
    count: number;
    factor: number;
    metresPerGarment: number;
  }>;
}

export interface ConsumptionSheet {
  estimateId: string;
  styleId: string;
  version: number;
  status: EstimateStatus;
  wastagePct: number;
  currency: string;
  styleNo: string;
  styleName: string;
  orderQty: number;
  colourwayCount: number;
  roleSummary: SheetRoleSummary[];
  operations: SheetOperationDetail[];
  totals: CalcTotals;
  submittedBy: string | null;
  submittedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  isDraft: boolean;
}

export async function getConsumptionSheet(id: string): Promise<ConsumptionSheet> {
  const res = await httpClient.get<ConsumptionSheet>(`/estimates/${id}/sheet`);
  return res.data;
}

/**
 * The export endpoint sits behind the same bearer-token auth as everything else, so a
 * plain `<a href>` to it would 401 — the token lives in memory, not a browser-readable
 * cookie. Fetching it through httpClient (which attaches the header) and triggering the
 * download from the resulting blob is what actually works.
 */
export async function downloadExport(
  id: string,
  format: 'xlsx' | 'pdf',
  filenameHint: string,
): Promise<void> {
  const res = await httpClient.get(`/estimates/${id}/export`, {
    params: { format },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(res.data as Blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filenameHint;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
