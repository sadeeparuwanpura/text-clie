import { httpClient } from './httpClient';
import type { ThreadLineRole } from '../types/threadLineRole';

export interface SewOff {
  id: string;
  styleId: string;
  operationId: string;
  role: ThreadLineRole;
  measuredMetres: number;
  garmentsSewn: number;
  impliedFactor: number;
  estimateFactor: number;
  variancePct: number;
  exceedsThreshold: boolean;
  promotedAt: string | null;
  promotedBy: string | null;
  notes: string | null;
  createdBy: string;
}

export interface RecordSewOffInput {
  operationId: string;
  role: ThreadLineRole;
  measuredMetres: number;
  garmentsSewn: number;
  notes?: string;
}

export async function recordSewOff(styleId: string, input: RecordSewOffInput): Promise<SewOff> {
  const res = await httpClient.post<SewOff>(`/styles/${styleId}/sew-offs`, input);
  return res.data;
}

export async function listSewOffsForStyle(styleId: string): Promise<SewOff[]> {
  const res = await httpClient.get<SewOff[]>(`/styles/${styleId}/sew-offs`);
  return res.data;
}

export async function promoteSewOff(id: string): Promise<SewOff> {
  const res = await httpClient.post<SewOff>(`/sew-offs/${id}/promote`);
  return res.data;
}
