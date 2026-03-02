/// <reference path="../.astro/types.d.ts" />

import type { Language } from "./lib/business";
import type { BusinessProfile, Theme } from "@mshorizon/schema";

declare namespace App {
  interface Locals {
    businessId: string;
    currentLang: Language;
    businessData: BusinessProfile;
    theme: Theme;
    t: Record<string, Record<string, string>>;
    availableBusinesses: string[];
  }
}
