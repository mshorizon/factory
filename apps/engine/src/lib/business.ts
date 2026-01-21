// Get business ID from environment variable
const businessId = import.meta.env.PUBLIC_BUSINESS || "honey-worker";

// Import all business data and themes
const businessDataFiles = import.meta.glob("../../../../data/*/*.json", { eager: true });

// Helper to get file content
function getJsonFile(pattern: string): any {
  const key = Object.keys(businessDataFiles).find((k) => k.includes(pattern));
  return key ? (businessDataFiles[key] as any).default : null;
}

// Load business data
export const businessData = getJsonFile(`/${businessId}/${businessId}.json`);
export const theme = getJsonFile(`/${businessId}/theme.json`);

// Export business ID for reference
export { businessId };
