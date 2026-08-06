import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';

export interface ThreadLine {
  role: ThreadLineRole;
  included: boolean;
  count: number;
  factor: number;
  updatedBy: string | null;
  updatedAt: string | null;
}

export interface Operation {
  id: string;
  styleId: string;
  sequence: number;
  name: string;
  section: string | null;
  seamLengthCm: number;
  reps: number;
  spi: number;
  note: string | null;
  machineTypeId: string | null;
  threadLines: ThreadLine[];
  fabricId: string | null;
  lineSeamM: number;
}

export interface OperationListResult {
  data: Operation[];
  totalSeamM: number;
}

export async function listOperations(styleId: string): Promise<OperationListResult> {
  const res = await httpClient.get<OperationListResult>(`/styles/${styleId}/operations`);
  return res.data;
}

export interface OperationLineInput {
  name: string;
  section?: string;
  seamLengthCm: number;
  reps: number;
  spi: number;
  note?: string;
  fabricId?: string;
}

export async function createOperation(
  styleId: string,
  input: OperationLineInput,
): Promise<Operation> {
  const res = await httpClient.post<Operation>(`/styles/${styleId}/operations`, input);
  return res.data;
}

export async function addBlankOperations(styleId: string, count: number): Promise<Operation[]> {
  const res = await httpClient.post<Operation[]>(`/styles/${styleId}/operations/blank`, { count });
  return res.data;
}

export async function seedOperationsFromLibrary(styleId: string): Promise<Operation[]> {
  const res = await httpClient.post<Operation[]>(`/styles/${styleId}/operations/seed`);
  return res.data;
}

export async function updateOperation(
  operationId: string,
  input: Partial<OperationLineInput>,
): Promise<Operation> {
  const res = await httpClient.patch<Operation>(`/operations/${operationId}`, input);
  return res.data;
}

export async function deleteOperation(operationId: string): Promise<void> {
  await httpClient.delete(`/operations/${operationId}`);
}

export async function reorderOperations(
  styleId: string,
  orderedOperationIds: string[],
): Promise<Operation[]> {
  const res = await httpClient.patch<Operation[]>('/operations/reorder', {
    styleId,
    orderedOperationIds,
  });
  return res.data;
}

export interface OverrideLossError {
  requiresConfirmation: true;
}

export async function assignMachineType(
  operationId: string,
  machineTypeId: string,
  confirmOverrideLoss = false,
): Promise<Operation> {
  const res = await httpClient.patch<Operation>(`/operations/${operationId}/machine-type`, {
    machineTypeId,
    confirmOverrideLoss,
  });
  return res.data;
}

export async function assignMachineTypeBulk(
  operationIds: string[],
  machineTypeId: string,
  confirmOverrideLoss = false,
): Promise<Operation[]> {
  const res = await httpClient.patch<Operation[]>('/operations/machine-type/bulk', {
    operationIds,
    machineTypeId,
    confirmOverrideLoss,
  });
  return res.data;
}

export interface ThreadLineInput {
  role: ThreadLineRole;
  included: boolean;
  count: number;
  factor: number;
}

export async function updateThreadLines(
  operationId: string,
  threadLines: ThreadLineInput[],
): Promise<Operation> {
  const res = await httpClient.put<Operation>(`/operations/${operationId}/thread-lines`, {
    threadLines,
  });
  return res.data;
}

export async function resetThreadLines(operationId: string): Promise<Operation> {
  const res = await httpClient.post<Operation>(`/operations/${operationId}/thread-lines/reset`);
  return res.data;
}
