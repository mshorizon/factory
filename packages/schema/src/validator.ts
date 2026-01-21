import Ajv from "ajv";
import addFormats from "ajv-formats";
import businessSchema from "./business.schema.json" with { type: "json" };
import themeSchema from "./theme.schema.json" with { type: "json" };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateBusinessProfile = ajv.compile(businessSchema);
export const validateThemeSchema = ajv.compile(themeSchema);

export function validate(data: unknown): { valid: boolean; errors: typeof validateBusinessProfile.errors } {
  const valid = validateBusinessProfile(data);
  return { valid, errors: validateBusinessProfile.errors };
}

export function validateTheme(data: unknown): { valid: boolean; errors: typeof validateThemeSchema.errors } {
  const valid = validateThemeSchema(data);
  return { valid, errors: validateThemeSchema.errors };
}
