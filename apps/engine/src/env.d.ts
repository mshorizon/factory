/// <reference path="../.astro/types.d.ts" />

import type { Language } from "./lib/business";
import type { BusinessProfileV15, ThemeV15 } from "@mshorizon/schema";

declare namespace App {
  interface Locals {
    businessId: string;
    currentLang: Language;
    businessData: BusinessProfileV15;
    theme: ThemeV15;
    t: Record<string, Record<string, string>>;
    availableBusinesses: string[];
  }
}
