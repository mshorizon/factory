/**
 * LessonStore (DESIGN §9.1/§9.4) — persistence seam for the semantic lessons.
 *
 * Interface + in-memory impl (tests/dev); the Drizzle-backed impl lives in
 * @mshorizon/db against the pgvector `sitc_lessons` table.
 */
export interface LessonRecord {
  id: number;
  scope: string;
  designTraits: string[];
  trigger: string;
  lesson: string;
  embedding: number[] | null;
  evidenceRunId: number | null;
  scoreDelta: number | null;
  confidence: number;
  uses: number;
  wins: number;
  archived: boolean;
}

export interface NewLesson {
  scope: string;
  designTraits?: string[];
  trigger: string;
  lesson: string;
  embedding?: number[];
  evidenceRunId?: number;
  scoreDelta?: number;
  confidence?: number;
}

export interface LessonStore {
  insert(lesson: NewLesson): Promise<LessonRecord>;
  update(id: number, patch: Partial<LessonRecord>): Promise<LessonRecord>;
  /** Active lessons matching scope and/or overlapping design traits (tag pre-filter, §9.2). */
  candidates(filter: { scope?: string; designTraits?: string[] }): Promise<LessonRecord[]>;
  all(includeArchived?: boolean): Promise<LessonRecord[]>;
  /** Record a use; if `won`, also a win. Caller recomputes/sets confidence. */
  recordUse(id: number, won: boolean): Promise<LessonRecord>;
  archive(id: number): Promise<void>;
}

export class InMemoryLessonStore implements LessonStore {
  private rows = new Map<number, LessonRecord>();
  private seq = 0;

  async insert(l: NewLesson): Promise<LessonRecord> {
    const id = ++this.seq;
    const rec: LessonRecord = {
      id,
      scope: l.scope,
      designTraits: l.designTraits ?? [],
      trigger: l.trigger,
      lesson: l.lesson,
      embedding: l.embedding ?? null,
      evidenceRunId: l.evidenceRunId ?? null,
      scoreDelta: l.scoreDelta ?? null,
      confidence: l.confidence ?? 0,
      uses: 0,
      wins: 0,
      archived: false,
    };
    this.rows.set(id, rec);
    return { ...rec };
  }

  async update(id: number, patch: Partial<LessonRecord>): Promise<LessonRecord> {
    const r = this.rows.get(id);
    if (!r) throw new Error(`lesson ${id} not found`);
    Object.assign(r, patch);
    return { ...r };
  }

  async candidates(filter: { scope?: string; designTraits?: string[] }): Promise<LessonRecord[]> {
    const traits = new Set(filter.designTraits ?? []);
    return [...this.rows.values()]
      .filter((r) => !r.archived)
      .filter((r) => {
        const scopeOk = !filter.scope || r.scope === filter.scope || r.scope === "general";
        // A lesson with NO trait tags is a wildcard (applies to any design) —
        // excluding it when the query carries traits would hide general lessons.
        const traitOk = traits.size === 0 || r.designTraits.length === 0 || r.designTraits.some((t) => traits.has(t));
        return scopeOk && traitOk;
      })
      .map((r) => ({ ...r }));
  }

  async all(includeArchived = false): Promise<LessonRecord[]> {
    return [...this.rows.values()].filter((r) => includeArchived || !r.archived).map((r) => ({ ...r }));
  }

  async recordUse(id: number, won: boolean): Promise<LessonRecord> {
    const r = this.rows.get(id);
    if (!r) throw new Error(`lesson ${id} not found`);
    r.uses += 1;
    if (won) r.wins += 1;
    return { ...r };
  }

  async archive(id: number): Promise<void> {
    const r = this.rows.get(id);
    if (r) r.archived = true;
  }
}
