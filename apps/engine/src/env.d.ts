/// <reference path="../.astro/types.d.ts" />

import type { Language } from "./lib/business";

declare namespace App {
  interface Locals {
    businessId: string;
    currentLang: Language;
    businessData: any;
    theme: any;
    t: Record<string, any>;
    availableBusinesses: string[];
  }
}
