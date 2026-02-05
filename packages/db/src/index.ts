export { sites, type Site, type NewSite } from "./schema.js";
export { initDb, getDb } from "./client.js";
export {
  getAllSubdomains,
  getSiteBySubdomain,
  upsertSiteConfig,
  updateSiteTranslations,
} from "./queries.js";
