import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';

export interface ShadeByColourway {
  colourwayId: string;
  shadeCode: string;
}

export interface ThreadAssignment {
  id: string;
  styleId: string;
  role: ThreadLineRole;
  varietyId: string;
  ticket: number;
  coneLengthM: number;
  supplierId: string | null;
  unitPrice: number;
  currency: string;
  shadeByColourway: ShadeByColourway[];
  isOrphaned: boolean;
}

export interface RoleRow {
  role: ThreadLineRole;
  assignment: ThreadAssignment | null;
}

export interface AssignmentListResult {
  inUse: RoleRow[];
  orphaned: ThreadAssignment[];
}

export async function listThreadAssignments(styleId: string): Promise<AssignmentListResult> {
  const res = await httpClient.get<AssignmentListResult>(`/styles/${styleId}/thread-assignments`);
  return res.data;
}

export interface AssignmentUpsertInput {
  varietyId: string;
  ticket: number;
  coneLengthM: number;
  supplierId?: string;
  unitPrice: number;
  currency?: string;
  shadeByColourway: ShadeByColourway[];
}

export async function upsertThreadAssignment(
  styleId: string,
  role: ThreadLineRole,
  input: AssignmentUpsertInput,
): Promise<ThreadAssignment> {
  const res = await httpClient.put<ThreadAssignment>(
    `/styles/${styleId}/thread-assignments/${encodeURIComponent(role)}`,
    input,
  );
  return res.data;
}

export async function fillRecommendedAssignments(styleId: string): Promise<ThreadAssignment[]> {
  const res = await httpClient.post<ThreadAssignment[]>(
    `/styles/${styleId}/thread-assignments/fill-recommended`,
  );
  return res.data;
}
