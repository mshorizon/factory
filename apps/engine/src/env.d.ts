/// <reference path="../.astro/types.d.ts" />

import type { Logger } from "pino";
import type { Language } from "./lib/business";
import type { BusinessProfile, Theme } from "@mshorizon/schema";
import type { Site } from "@mshorizon/db";
import type { JWTPayload } from "./lib/auth";

declare namespace App {
  interface Locals {
    businessId: string;
    currentLang: Language;
    businessData: BusinessProfile;
    theme: Theme;
    t: Record<string, Record<string, string>>;
    availableBusinesses: string[];
    site: Site | null;
    auth: JWTPayload | null;
    logger: Logger;
  }
}
