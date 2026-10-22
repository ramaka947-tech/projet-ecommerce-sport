import { getSettings } from '@/lib/api';

export type CgvSection = { title: string; content: string };

export function parseCgv(raw?: string): CgvSection[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getCgv(): Promise<CgvSection[]> {
  try {
    const settings = await getSettings();
    return parseCgv(settings.cgv);
  } catch {
    return [];
  }
}