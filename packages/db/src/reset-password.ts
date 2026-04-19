/**
 * Reset password for an existing user.
 * Usage: DATABASE_URL="..." npx tsx src/reset-password.ts <email> <new-password>
 */
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const [email, password] = process.argv.slice(2);

  if (!email || !password) {
    console.error('Usage: npx tsx src/reset-password.ts <email> <new-password>');
    process.exit(1);
  }
  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  const client = postgres(process.env.DATABASE_URL!);
  const db = drizzle(client, { schema });

  try {
    const passwordHash = await bcrypt.hash(password, 12);
    const [updated] = await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.email, email))
      .returning();

    if (!updated) {
      console.error(`No user found with email "${email}".`);
      process.exit(1);
    }
    console.log(`Password reset for ${updated.email} (role: ${updated.role})`);
  } finally {
    await client.end();
  }
}

main();
