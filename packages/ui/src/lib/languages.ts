export interface LanguageOption {
  code: string;
  label: string;
}

export const DEFAULT_LANGUAGES: LanguageOption[] = [
  { code: "pl", label: "Polski" },
  { code: "en", label: "English" },
];
