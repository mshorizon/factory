import Ajv from "ajv";
import addFormats from "ajv-formats";
import businessSchema from "./business.schema.json" with { type: "json" };

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);

export const validateBusinessProfile = ajv.compile(businessSchema);

export function validate(data: unknown): { valid: boolean; errors: typeof validateBusinessProfile.errors } {
  const valid = validateBusinessProfile(data);
  return { valid, errors: validateBusinessProfile.errors };
}
