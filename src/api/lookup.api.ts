import { httpClient } from './httpClient';
import type { PaginatedResponse } from './machineType.api';

/**
 * Buyers, seasons and style types are full CRUD resources on the backend (P1), but this
 * phase only needs them as read-only options for the style form's selects — no admin
 * screens for them yet, since the SRS's screen inventory doesn't call out dedicated
 * "Buyers"/"Seasons" screens the way it does for machine types and thread varieties.
 */

export interface Buyer {
  id: string;
  code: string;
  name: string;
  contact: string;
  isActive: boolean;
}

export interface Season {
  id: string;
  code: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
}

export interface StyleTypeOption {
  id: string;
  code: string;
  name: string;
  family: string;
  isActive: boolean;
}

const LOOKUP_LIMIT = 200; // matches the API's max page size — these lists are small master data

/**
 * `activeOnly` defaults to true (what a "new style" form's dropdown should offer, per
 * FR-MD-03). Pass false when resolving id → name for *existing* records instead, which
 * must keep rendering correctly even once the referenced master record is deactivated.
 */
export async function listBuyers(activeOnly = true): Promise<Buyer[]> {
  const res = await httpClient.get<PaginatedResponse<Buyer>>('/buyers', {
    params: { limit: LOOKUP_LIMIT, ...(activeOnly ? { isActive: true } : {}) },
  });
  return res.data.data;
}

export async function listSeasons(activeOnly = true): Promise<Season[]> {
  const res = await httpClient.get<PaginatedResponse<Season>>('/seasons', {
    params: { limit: LOOKUP_LIMIT, ...(activeOnly ? { isActive: true } : {}) },
  });
  return res.data.data;
}

export async function listStyleTypes(activeOnly = true): Promise<StyleTypeOption[]> {
  const res = await httpClient.get<PaginatedResponse<StyleTypeOption>>('/style-types', {
    params: { limit: LOOKUP_LIMIT, ...(activeOnly ? { isActive: true } : {}) },
  });
  return res.data.data;
}
