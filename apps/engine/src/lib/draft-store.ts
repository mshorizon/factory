// In-memory draft store for admin preview
// Drafts persist only in the Node SSR process — no disk writes

export interface DraftData {
  businessData: Record<string, unknown>;
  translations: {
    en: Record<string, unknown>;
    pl: Record<string, unknown>;
  };
}

const drafts = new Map<string, DraftData>();

export function setDraft(businessId: string, data: DraftData): void {
  drafts.set(businessId, data);
}

export function getDraft(businessId: string): DraftData | undefined {
  return drafts.get(businessId);
}

export function clearDraft(businessId: string): void {
  drafts.delete(businessId);
}
