// In-memory draft store for admin preview
// Drafts persist only in the Node SSR process — no disk writes

export interface DraftData {
  businessData: Record<string, unknown>;
  translations: {
    en: Record<string, unknown>;
    pl: Record<string, unknown>;
  };
}

interface DraftEntry {
  data: DraftData;
  createdAt: number;
}

const MAX_DRAFTS = 50;
const DRAFT_TTL_MS = 30 * 60 * 1000; // 30 minutes

const drafts = new Map<string, DraftEntry>();

function evictStale(): void {
  const now = Date.now();
  for (const [key, entry] of drafts) {
    if (now - entry.createdAt > DRAFT_TTL_MS) {
      drafts.delete(key);
    }
  }
}

export function setDraft(businessId: string, data: DraftData): void {
  evictStale();
  // If at capacity, remove the oldest entry
  if (drafts.size >= MAX_DRAFTS && !drafts.has(businessId)) {
    const oldestKey = drafts.keys().next().value;
    if (oldestKey) drafts.delete(oldestKey);
  }
  drafts.set(businessId, { data, createdAt: Date.now() });
}

export function getDraft(businessId: string): DraftData | undefined {
  const entry = drafts.get(businessId);
  if (!entry) return undefined;
  if (Date.now() - entry.createdAt > DRAFT_TTL_MS) {
    drafts.delete(businessId);
    return undefined;
  }
  return entry.data;
}

export function clearDraft(businessId: string): void {
  drafts.delete(businessId);
}
