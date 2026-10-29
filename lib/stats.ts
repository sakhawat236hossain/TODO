import { statsApi } from './api';
import type { DashboardStats } from './types';

export async function getDashboardStats(): Promise<DashboardStats> {
  return statsApi.get();
}
