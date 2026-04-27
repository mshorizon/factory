import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

const rows = await sql`SELECT config::text as raw FROM sites WHERE subdomain = 'notariuszwgarwolinie'`;
const raw = rows[0].raw as string;

let actualConfig = JSON.parse(raw);
if (typeof actualConfig === 'string') {
  actualConfig = JSON.parse(actualConfig);
}

// Icon map for this business's services (slug → lucide icon name)
const slugIconMap: Record<string, string> = {
  'akty-notarialne': 'file-text',
  'poswiadczenia-dziedziczenia': 'users',
  'poswiadczenia': 'check-circle',
  'umowy-sprzedazy-nieruchomosci': 'home',
  'testamenty': 'scroll',
  'pelnomocnictwa': 'stamp',
};

actualConfig.pages.home.sections = actualConfig.pages.home.sections.map((section: any) => {
  if (section.type === 'services') {
    return {
      ...section,
      showIcons: true,
      items: (section.items || []).map((item: any) => ({
        ...item,
        icon: slugIconMap[item.slug] || item.icon,
      })),
    };
  }
  return section;
});

const servicesSection = actualConfig.pages.home.sections.find((s: any) => s.type === 'services');
console.log('Services section after update:', JSON.stringify(servicesSection, null, 2));

await sql`UPDATE sites SET config = ${sql.json(actualConfig)} WHERE subdomain = 'notariuszwgarwolinie'`;
console.log('Config updated successfully');

await sql.end();
