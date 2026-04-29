import { desc, eq } from "drizzle-orm";
import { getDb } from "./client.js";
import { tasks, TASK_STATUSES } from "./schema.js";
import type { NewTask, Task, TaskStatus } from "./schema.js";

export async function listTasks(): Promise<Task[]> {
  const db = getDb();
  return db.select().from(tasks).orderBy(desc(tasks.createdAt));
}

export async function getTaskById(id: string): Promise<Task | null> {
  const db = getDb();
  const [row] = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
  return row ?? null;
}

export async function getFirstPendingTask(): Promise<Task | null> {
  const db = getDb();
  const [row] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.status, "pending"))
    .orderBy(tasks.createdAt)
    .limit(1);
  return row ?? null;
}

export async function createTask(data: Omit<NewTask, "id" | "createdAt" | "updatedAt" | "status"> & { status?: TaskStatus }): Promise<Task> {
  const db = getDb();
  const [row] = await db
    .insert(tasks)
    .values({
      status: data.status ?? "pending",
      domain: data.domain,
      template: data.template,
      location: data.location,
      page: data.page ?? null,
      section: data.section ?? null,
      isAdminPanel: data.isAdminPanel ?? false,
      description: data.description,
      isSuperAdmin: data.isSuperAdmin ?? false,
    })
    .returning();
  return row;
}

export async function updateTaskStatus(id: string, status: TaskStatus): Promise<Task | null> {
  if (!TASK_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }
  const db = getDb();
  const [row] = await db
    .update(tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return row ?? null;
}

export async function updateTask(
  id: string,
  fields: Partial<Pick<Task, "status" | "description" | "clarification" | "summary">>
): Promise<Task | null> {
  if (fields.status && !TASK_STATUSES.includes(fields.status as TaskStatus)) {
    throw new Error(`Invalid status: ${fields.status}`);
  }
  const db = getDb();
  const [row] = await db
    .update(tasks)
    .set({ ...fields, updatedAt: new Date() })
    .where(eq(tasks.id, id))
    .returning();
  return row ?? null;
}

export async function deleteTask(id: string): Promise<void> {
  const db = getDb();
  await db.delete(tasks).where(eq(tasks.id, id));
}

export { TASK_STATUSES };
export type { Task, NewTask, TaskStatus };
