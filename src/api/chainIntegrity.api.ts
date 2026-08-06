import { httpClient } from './httpClient';

export type ChainIssueType =
  'OPERATION_NO_MACHINE' | 'LINE_NO_FACTOR' | 'ROLE_UNASSIGNED' | 'SHADE_MISSING';

export interface ChainIssue {
  type: ChainIssueType;
  operationId?: string;
  operation?: string;
  role?: string;
  colourwayId?: string;
  colourway?: string;
}

export interface ChainCheckResult {
  ok: boolean;
  issues: ChainIssue[];
}

export async function checkChain(styleId: string): Promise<ChainCheckResult> {
  const res = await httpClient.get<ChainCheckResult>(`/styles/${styleId}/chain-check`);
  return res.data;
}
