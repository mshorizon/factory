/** validate — wraps the canonical AJV validation from @mshorizon/schema. */
import { validate as schemaValidate } from "@mshorizon/schema";
import type { ValidationResult } from "../types.js";

export function validateProfile(profile: unknown): ValidationResult {
  const { valid, errors } = schemaValidate(profile);
  return {
    valid,
    errors: (errors ?? []).map((e) => ({
      instancePath: e.instancePath,
      message: e.message,
    })),
  };
}
