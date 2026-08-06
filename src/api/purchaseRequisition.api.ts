import { httpClient } from './httpClient';
import type { PaginatedResponse } from './machineType.api';

export interface RequisitionLine {
  varietyId: string;
  varietyCode: string;
  varietyName: string;
  ticket: number;
  shadeCode: string;
  coneLengthM: number;
  cones: number;
  unitPrice: number;
  currency: string;
  value: number;
}

export type RequisitionStatus = 'Open' | 'Raised' | 'Cancelled';

export interface PurchaseRequisition {
  id: string;
  reqNo: string;
  estimateIds: string[];
  lines: RequisitionLine[];
  requiredBy: string;
  status: RequisitionStatus;
  erpDocNo: string | null;
  createdBy: string;
  totalValue: number;
}

export interface RequisitionOverrideError {
  requiresOverrideReason: true;
  existingReqNo: string;
}

export async function generateRequisitionFromEstimate(
  estimateId: string,
  requiredBy: string,
  overrideReason?: string,
): Promise<PurchaseRequisition> {
  const res = await httpClient.post<PurchaseRequisition>(`/estimates/${estimateId}/requisition`, {
    requiredBy,
    overrideReason,
  });
  return res.data;
}

export async function generateConsolidatedRequisition(
  estimateIds: string[],
  requiredBy: string,
  overrideReason?: string,
): Promise<PurchaseRequisition> {
  const res = await httpClient.post<PurchaseRequisition>('/requisitions', {
    estimateIds,
    requiredBy,
    overrideReason,
  });
  return res.data;
}

export interface RequisitionListParams {
  page?: number;
  limit?: number;
  status?: RequisitionStatus;
}

export async function listRequisitions(
  params: RequisitionListParams = {},
): Promise<PaginatedResponse<PurchaseRequisition>> {
  const res = await httpClient.get<PaginatedResponse<PurchaseRequisition>>('/requisitions', {
    params,
  });
  return res.data;
}

export async function getRequisition(id: string): Promise<PurchaseRequisition> {
  const res = await httpClient.get<PurchaseRequisition>(`/requisitions/${id}`);
  return res.data;
}

export async function markRequisitionRaised(
  id: string,
  erpDocNo: string,
): Promise<PurchaseRequisition> {
  const res = await httpClient.post<PurchaseRequisition>(`/requisitions/${id}/mark-raised`, {
    erpDocNo,
  });
  return res.data;
}

/** Same auth-header-over-blob pattern as the consumption sheet export — see estimate.api.ts. */
export async function downloadRequisitionExport(
  id: string,
  format: 'xlsx' | 'pdf',
  filenameHint: string,
): Promise<void> {
  const res = await httpClient.get(`/requisitions/${id}/export`, {
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
