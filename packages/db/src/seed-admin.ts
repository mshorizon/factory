/**
 * Script to create the initial super-admin user.
 * Usage: DATABASE_URL="..." npx tsx src/seed-admin.ts <email> <password>
 * Example: DATABASE_URL="..." npx tsx src/seed-admin.ts admin@example.com password123
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';
import * as schema from './schema.js';
import { eq } from 'drizzle-orm';

async function main() {
  const args = process.argv.slice(2);
  const email = args[0];
  const password = args[1];

  if (!email || !password) {
    console.error('Usage: npx tsx src/seed-admin.ts <email> <password>');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters long.');
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL environment variable is required.');
    process.exit(1);
  }

  const client = postgres(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    // Check if user already exists
    const [existing] = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, email))
      .limit(1);

    if (existing) {
      console.log(`User with email "${email}" already exists (id: ${existing.id}, role: ${existing.role}).`);
      await client.end();
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [user] = await db
      .insert(schema.users)
      .values({
        email,
        passwordHash,
        role: 'super-admin',
        businessId: null,
      })
      .returning();

    console.log(`Super-admin created successfully:`);
    console.log(`  ID:    ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Role:  ${user.role}`);
  } catch (err) {
    console.error('Error creating user:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
