import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="admin-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
