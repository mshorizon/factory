import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const rows = await sql`SELECT subdomain, config FROM sites WHERE subdomain = 'notariuszwgarwolinie'`;

if (rows.length === 0) {
  console.log('NOT FOUND');
} else {
  const config = rows[0].config as any;
  console.log('SECTIONS:', JSON.stringify(config?.pages?.home?.sections?.map((s: any) => ({type: s.type, variant: s.variant})), null, 2));
  console.log('HERO:', JSON.stringify(config?.pages?.home?.sections?.[0], null, 2));
  console.log('ASSETS:', JSON.stringify(config?.business?.assets, null, 2));
  console.log('SERVICES_ICONS:', JSON.stringify(config?.data?.services?.map((s: any) => ({id: s.id, icon: s.icon})), null, 2));
  console.log('FEATURES:', JSON.stringify(config?.pages?.home?.sections?.find((s: any) => s.type === 'features'), null, 2));
}

await sql.end();
