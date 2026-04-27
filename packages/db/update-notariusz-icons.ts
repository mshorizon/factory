import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const rows = await sql`SELECT config FROM sites WHERE subdomain = 'notariuszwgarwolinie'`;

if (rows.length === 0) {
  console.error('Business notariuszwgarwolinie not found');
  process.exit(1);
}

const config = rows[0].config as any;

// Update the services section to enable showIcons
config.pages.home.sections = config.pages.home.sections.map((section: any) => {
  if (section.type === 'services') {
    return { ...section, showIcons: true };
  }
  return section;
});

await sql`UPDATE sites SET config = ${JSON.stringify(config)}::jsonb WHERE subdomain = 'notariuszwgarwolinie'`;
console.log('Updated notariuszwgarwolinie services section with showIcons: true');

await sql.end();
