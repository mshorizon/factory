import { useState, useCallback, useEffect, useRef } from "react";
import rjsfCore from "@rjsf/core";
import rjsfValidator from "@rjsf/validator-ajv8";
import type { RJSFSchema } from "@rjsf/utils";
import { ColorPickerWidget } from "./widgets/ColorPickerWidget";
import { ImageUrlWidget } from "./widgets/ImageUrlWidget";
import SectionEditor from "./SectionEditor";

// Handle CJS/ESM interop
const Form = (rjsfCore as any).default || rjsfCore;
const validator = (rjsfValidator as any).default || rjsfValidator;

interface AdminFormProps {
  businessId: string;
  initialData: Record<string, unknown>;
  schema: RJSFSchema;
  translations?: {
    en: Record<string, unknown>;
    pl: Record<string, unknown>;
  };
}

type SaveStatus = "idle" | "saving" | "success" | "error";
type TabType = "meta" | "theme" | "navbar" | "footer" | "translations-en" | "translations-pl" | string;

const configWidgets = {
  ColorPickerWidget,
  ImageUrlWidget,
};

// Auto-detect color fields by their hex pattern and map them to ColorPickerWidget
function generateColorUiSchema(schema: RJSFSchema): Record<string, any> {
  const uiSchema: Record<string, any> = {};
  if (!schema.properties) return uiSchema;
  for (const [key, prop] of Object.entries(schema.properties)) {
    const p = prop as any;
    if (p.type === "string" && p.pattern?.includes("#[0-9A-Fa-f]")) {
      uiSchema[key] = { "ui:widget": "ColorPickerWidget" };
    } else if (p.type === "object" && p.properties) {
      const nested = generateColorUiSchema(p);
      if (Object.keys(nested).length > 0) uiSchema[key] = nested;
    }
  }
  return uiSchema;
}

// Extract a sub-schema for a specific path, preserving definitions
function getSubSchema(schema: RJSFSchema, path: string[]): RJSFSchema {
  let current: any = schema;
  for (const key of path) {
    if (current.properties?.[key]) {
      current = current.properties[key];
    } else if (current.additionalProperties) {
      current = current.additionalProperties;
    } else {
      return { type: "object", properties: {} };
    }
  }
  return {
    ...current,
    definitions: schema.definitions,
  } as RJSFSchema;
}

// Get nested value from object
function getNestedValue(obj: Record<string, unknown>, path: string[]): any {
  let current: any = obj;
  for (const key of path) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return current;
}

// Set nested value in object (immutably)
function setNestedValue(
  obj: Record<string, unknown>,
  path: string[],
  value: unknown
): Record<string, unknown> {
  if (path.length === 0) return value as Record<string, unknown>;
  const [first, ...rest] = path;
  return {
    ...obj,
    [first]: rest.length === 0
      ? value
      : setNestedValue((obj[first] || {}) as Record<string, unknown>, rest, value),
  };
}

// Deep compare two values
function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

export default function AdminForm({ businessId, initialData, schema, translations }: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [translationsData, setTranslationsData] = useState({
    en: translations?.en || {},
    pl: translations?.pl || {},
  });

  // Keep a snapshot of the saved state for revert
  const savedDataRef = useRef<Record<string, unknown>>(structuredClone(initialData));
  const savedTransRef = useRef({ en: translations?.en || {}, pl: translations?.pl || {} });

  // Persist activeTab across HMR/reloads
  const [activeTab, setActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem(`admin-tab-${businessId}`) as TabType) || "meta";
    }
    return "meta";
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [newPageName, setNewPageName] = useState("");

  // Save activeTab to sessionStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`admin-tab-${businessId}`, activeTab);
    }
  }, [activeTab, businessId]);

  const pages = formData.pages as Record<string, unknown> | undefined;
  const pageNames = pages ? Object.keys(pages) : [];

  // Track whether there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debounced draft update for live preview (no disk write)
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setHasUnsavedChanges(true);

    // Clear previous timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Debounce draft update and refresh preview
    debounceRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/admin/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            data: formData,
            translations: translationsData,
          }),
        });
        if (!res.ok) throw new Error("Draft update failed");

        setSaveStatus("idle");

        // Refresh preview iframe
        if (typeof (window as any).refreshPreview === "function") {
          (window as any).refreshPreview();
        }
      } catch (err) {
        setSaveStatus("error");
        setErrorMessage("Preview update failed");
      }
    }, 800);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [formData, translationsData, businessId]);

  // SVG icons for sidebar (14x14, stroke-based)
  const icons: Record<string, React.ReactNode> = {
    meta: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    theme: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="6.5" cy="13.5" r="2.5"/><circle cx="17.5" cy="13.5" r="2.5"/><path d="M13.5 9v2.5"/><path d="M6.5 11V9"/><path d="M17.5 11V9"/></svg>,
    navbar: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>,
    footer: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 15h18"/></svg>,
    page: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>,
    translations: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  };

  const tabs: { id: TabType; label: string; icon?: React.ReactNode }[] = [
    { id: "meta", label: "Business Info", icon: icons.meta },
    { id: "theme", label: "Theme", icon: icons.theme },
    { id: "navbar", label: "Navbar", icon: icons.navbar },
    { id: "footer", label: "Footer", icon: icons.footer },
    ...pageNames.map((name) => ({ id: `page-${name}` as TabType, label: name, icon: icons.page })),
    { id: "translations-en", label: "EN", icon: icons.translations },
    { id: "translations-pl", label: "PL", icon: icons.translations },
  ];

  // --- Change detection per tab ---
  function isTabChanged(tabId: string): boolean {
    const saved = savedDataRef.current;
    const savedTrans = savedTransRef.current;

    if (tabId === "meta") {
      return !deepEqual(formData.business, saved.business);
    }
    if (tabId === "theme") return !deepEqual(formData.theme, saved.theme);
    if (tabId === "navbar") return !deepEqual(getNestedValue(formData, ["layout", "navbar"]), getNestedValue(saved, ["layout", "navbar"]));
    if (tabId === "footer") return !deepEqual(getNestedValue(formData, ["layout", "footer"]), getNestedValue(saved, ["layout", "footer"]));
    if (tabId === "translations-en") return !deepEqual(translationsData.en, savedTrans.en);
    if (tabId === "translations-pl") return !deepEqual(translationsData.pl, savedTrans.pl);
    if (tabId.startsWith("page-")) {
      const pageName = tabId.replace("page-", "");
      return !deepEqual(getNestedValue(formData, ["pages", pageName]), getNestedValue(saved, ["pages", pageName]));
    }
    return false;
  }

  function revertTab(tabId: string) {
    const saved = savedDataRef.current;
    const savedTrans = savedTransRef.current;

    if (tabId === "meta") {
      setFormData((prev) => ({
        ...prev,
        business: structuredClone(saved.business),
      }));
    } else if (tabId === "theme") {
      setFormData((prev) => ({ ...prev, theme: structuredClone(saved.theme) }));
    } else if (tabId === "navbar") {
      setFormData((prev) => setNestedValue(prev, ["layout", "navbar"], structuredClone(getNestedValue(saved, ["layout", "navbar"]))));
    } else if (tabId === "footer") {
      setFormData((prev) => setNestedValue(prev, ["layout", "footer"], structuredClone(getNestedValue(saved, ["layout", "footer"]))));
    } else if (tabId === "translations-en") {
      setTranslationsData((prev) => ({ ...prev, en: structuredClone(savedTrans.en) }));
    } else if (tabId === "translations-pl") {
      setTranslationsData((prev) => ({ ...prev, pl: structuredClone(savedTrans.pl) }));
    } else if (tabId.startsWith("page-")) {
      const pageName = tabId.replace("page-", "");
      setFormData((prev) => setNestedValue(prev, ["pages", pageName], structuredClone(getNestedValue(saved, ["pages", pageName]))));
    }
  }

  function revertAll() {
    setFormData(structuredClone(savedDataRef.current));
    setTranslationsData(structuredClone(savedTransRef.current));
    setHasUnsavedChanges(false);
  }

  const handleChange = useCallback((path: string[], data: { formData?: unknown }) => {
    if (data.formData !== undefined) {
      setFormData((prev) => setNestedValue(prev, path, data.formData));
      setSaveStatus("idle");
    }
  }, []);

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMessage(undefined);

    try {
      const response = await fetch(`/api/admin/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, data: formData }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to save");
      }

      const transResponse = await fetch(`/api/admin/save-translations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, translations: translationsData }),
      });

      if (!transResponse.ok) {
        const error = await transResponse.json();
        throw new Error(error.message || "Failed to save translations");
      }

      // Update saved snapshots
      savedDataRef.current = structuredClone(formData);
      savedTransRef.current = structuredClone(translationsData);

      setHasUnsavedChanges(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);

      // Refresh preview iframe
      if (typeof (window as any).refreshPreview === "function") {
        (window as any).refreshPreview();
      }
    } catch (error) {
      setSaveStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Save failed");
    }
  };

  const addPage = () => {
    if (!newPageName.trim()) return;
    const pageName = newPageName.trim().toLowerCase().replace(/\s+/g, "-");
    setFormData((prev) => ({
      ...prev,
      pages: {
        ...(prev.pages as Record<string, unknown>),
        [pageName]: {
          title: newPageName.trim(),
          sections: [],
        },
      },
    }));
    setNewPageName("");
    setActiveTab(`page-${pageName}`);
  };

  const removePage = (pageName: string) => {
    if (!confirm(`Delete page "${pageName}"?`)) return;
    setActiveTab("meta");
    setTimeout(() => {
      setFormData((prev) => {
        const currentPages = prev.pages as Record<string, unknown> | undefined;
        if (!currentPages) return prev;
        const { [pageName]: removed, ...remainingPages } = currentPages;
        return { ...prev, pages: remainingPages };
      });
    }, 0);
  };

  const addSection = (pageName: string) => {
    setFormData((prev) => {
      const pages = prev.pages as Record<string, any>;
      const page = pages[pageName];
      return {
        ...prev,
        pages: {
          ...pages,
          [pageName]: {
            ...page,
            sections: [
              ...(page.sections || []),
              { type: "hero", variant: "default", header: { title: "New Section" } },
            ],
          },
        },
      };
    });
  };

  const removeSection = (pageName: string, index: number) => {
    if (!confirm(`Delete section ${index + 1}?`)) return;
    setFormData((prev) => {
      const pages = prev.pages as Record<string, any>;
      const page = pages[pageName];
      const newSections = [...page.sections];
      newSections.splice(index, 1);
      return {
        ...prev,
        pages: {
          ...pages,
          [pageName]: { ...page, sections: newSections },
        },
      };
    });
  };

  const movePage = (pageName: string, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const currentPages = prev.pages as Record<string, unknown> | undefined;
      if (!currentPages) return prev;
      const entries = Object.entries(currentPages);
      const idx = entries.findIndex(([k]) => k === pageName);
      if (idx === -1) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= entries.length) return prev;
      const [moved] = entries.splice(idx, 1);
      entries.splice(newIdx, 0, moved);
      return { ...prev, pages: Object.fromEntries(entries) };
    });
  };

  const moveSection = (pageName: string, index: number, direction: 'up' | 'down') => {
    setFormData((prev) => {
      const pages = prev.pages as Record<string, any>;
      const page = pages[pageName];
      const sections = [...page.sections];
      const newIdx = direction === 'up' ? index - 1 : index + 1;
      if (newIdx < 0 || newIdx >= sections.length) return prev;
      [sections[index], sections[newIdx]] = [sections[newIdx], sections[index]];
      return {
        ...prev,
        pages: { ...pages, [pageName]: { ...page, sections } },
      };
    });
  };

  // Translations editor component with grouping
  const TranslationsEditor = ({ lang }: { lang: "en" | "pl" }) => {
    const translations = (translationsData[lang] || {}) as Record<string, string>;
    const keys = Object.keys(translations).sort();

    const groups: Record<string, string[]> = {};
    for (const key of keys) {
      const firstPart = key.split(".")[0];
      if (!groups[firstPart]) {
        groups[firstPart] = [];
      }
      groups[firstPart].push(key);
    }
    const groupNames = Object.keys(groups).sort();

    const handleTranslationChange = (key: string, value: string) => {
      setTranslationsData((prev) => ({
        ...prev,
        [lang]: {
          ...(prev[lang] as Record<string, string>),
          [key]: value,
        },
      }));
      setSaveStatus("idle");
    };

    return (
      <div className="space-y-6">
        {groupNames.map((groupName) => (
          <div key={groupName} className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-200">
              <h4 className="font-semibold text-sm text-gray-700 uppercase tracking-wide">{groupName}</h4>
            </div>
            <div className="p-4 space-y-3">
              {groups[groupName].map((key) => (
                <div key={key} className="flex gap-4 items-start">
                  <label className="w-48 flex-shrink-0 text-sm text-gray-600 pt-2 break-all">
                    {key.substring(groupName.length + 1) || key}
                  </label>
                  <input
                    type="text"
                    value={translations[key] ?? ""}
                    onChange={(e) => handleTranslationChange(key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {keys.length === 0 && (
          <p className="text-gray-500 text-sm">No translations found.</p>
        )}
      </div>
    );
  };

  const getTabContent = () => {
    if (activeTab === "meta") {
      const metaSchema: RJSFSchema = {
        type: "object",
        properties: {
          business: schema.properties?.business,
        },
        definitions: schema.definitions,
      };
      return (
        <div className="rjsf-wrapper">
          <Form
            schema={metaSchema}
            uiSchema={generateColorUiSchema(metaSchema)}
            formData={{ business: formData.business }}
            validator={validator}
            widgets={configWidgets}
            formContext={{ businessId }}
            onChange={(data: any) => {
              if (data.formData) {
                setFormData((prev) => ({
                  ...prev,
                  business: data.formData.business,
                }));
                setSaveStatus("idle");
              }
            }}
            liveValidate={false}
          ><></></Form>
        </div>
      );
    }

    if (activeTab === "theme") {
      const themeData = (formData.theme || {}) as Record<string, any>;
      const currentMode: "light" | "dark" = themeData.mode || "light";

      // When switching to dark, ensure dark colors exist (copy from light)
      const ensureDarkColors = () => {
        const colors = themeData.colors || {};
        if (!colors.dark || !colors.dark.primary) {
          const lightColors = colors.light || {};
          handleChange(["theme", "colors", "dark"], {
            formData: structuredClone(lightColors),
          });
        }
      };

      const toggleMode = (mode: "light" | "dark") => {
        if (mode === "dark") ensureDarkColors();
        handleChange(["theme", "mode"], { formData: mode });
      };

      // Build color schema for the active mode with consistent titles
      const colorModeSchema: RJSFSchema = {
        type: "object",
        title: "Colors",
        properties: {
          primary: { type: "string", title: "Primary Color", pattern: "^#[0-9A-Fa-f]{6}$" },
          surface: {
            type: "object", title: "Surface Colors",
            properties: {
              base: { type: "string", title: "Base Surface", pattern: "^#[0-9A-Fa-f]{6}$" },
              alt: { type: "string", title: "Alt Surface", pattern: "^#[0-9A-Fa-f]{6}$" },
            },
          },
          text: {
            type: "object", title: "Text Colors",
            properties: {
              main: { type: "string", title: "Main Text", pattern: "^#[0-9A-Fa-f]{6}$" },
              muted: { type: "string", title: "Muted Text", pattern: "^#[0-9A-Fa-f]{6}$" },
              onPrimary: { type: "string", title: "Text on Primary", pattern: "^#[0-9A-Fa-f]{6}$" },
            },
          },
        },
      };

      // Remaining theme fields (preset, typography, ui)
      const themeMetaSchema: RJSFSchema = {
        type: "object",
        properties: {
          preset: schema.properties?.theme ? (schema.properties.theme as any).properties?.preset : undefined,
          typography: schema.properties?.theme ? (schema.properties.theme as any).properties?.typography : undefined,
          ui: schema.properties?.theme ? (schema.properties.theme as any).properties?.ui : undefined,
        },
        definitions: schema.definitions,
      };

      const colorData = getNestedValue(formData, ["theme", "colors", currentMode]) || {};

      return (
        <div className="space-y-6">
          {/* Mode toggle */}
          <div className="flex items-center justify-between px-1 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <span className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>Color Mode</span>
            <div
              className="relative flex items-center rounded-full cursor-pointer select-none"
              style={{ background: 'rgba(255,255,255,0.08)', padding: '3px', width: '120px', height: '32px' }}
              onClick={() => toggleMode(currentMode === "light" ? "dark" : "light")}
            >
              <div
                className="absolute rounded-full transition-all duration-200"
                style={{
                  width: '56px',
                  height: '26px',
                  background: 'var(--primary)',
                  left: currentMode === "light" ? '3px' : '61px',
                }}
              />
              <span
                className="relative z-10 flex-1 text-center text-[12px] font-medium transition-colors"
                style={{ color: currentMode === "light" ? '#fff' : 'rgba(255,255,255,0.4)' }}
              >Light</span>
              <span
                className="relative z-10 flex-1 text-center text-[12px] font-medium transition-colors"
                style={{ color: currentMode === "dark" ? '#fff' : 'rgba(255,255,255,0.4)' }}
              >Dark</span>
            </div>
          </div>

          {/* Color fields for active mode */}
          <div className="rjsf-wrapper">
            <Form
              key={currentMode}
              schema={colorModeSchema}
              uiSchema={generateColorUiSchema(colorModeSchema)}
              formData={colorData}
              validator={validator}
              widgets={configWidgets}
              formContext={{ businessId }}
              onChange={(data: any) => handleChange(["theme", "colors", currentMode], data)}
              liveValidate={false}
            ><></></Form>
          </div>

          {/* Preset, Typography, UI */}
          <div className="rjsf-wrapper">
            <Form
              schema={themeMetaSchema}
              formData={{ preset: themeData.preset, typography: themeData.typography, ui: themeData.ui }}
              validator={validator}
              widgets={configWidgets}
              formContext={{ businessId }}
              onChange={(data: any) => {
                if (data.formData) {
                  setFormData((prev) => ({
                    ...prev,
                    theme: {
                      ...(prev.theme as Record<string, unknown>),
                      preset: data.formData.preset,
                      typography: data.formData.typography,
                      ui: data.formData.ui,
                    },
                  }));
                  setSaveStatus("idle");
                }
              }}
              liveValidate={false}
            ><></></Form>
          </div>
        </div>
      );
    }

    if (activeTab === "navbar") {
      const navbarSchema = getSubSchema(schema, ["layout", "navbar"]);
      return (
        <div className="rjsf-wrapper">
          <Form
            schema={navbarSchema}
            formData={getNestedValue(formData, ["layout", "navbar"])}
            validator={validator}
            widgets={configWidgets}
            formContext={{ businessId }}
            onChange={(data: any) => handleChange(["layout", "navbar"], data)}
            liveValidate={false}
          ><></></Form>
        </div>
      );
    }

    if (activeTab === "footer") {
      const footerSchema = getSubSchema(schema, ["layout", "footer"]);
      return (
        <div className="rjsf-wrapper">
          <Form
            schema={footerSchema}
            formData={getNestedValue(formData, ["layout", "footer"])}
            validator={validator}
            widgets={configWidgets}
            formContext={{ businessId }}
            onChange={(data: any) => handleChange(["layout", "footer"], data)}
            liveValidate={false}
          ><></></Form>
        </div>
      );
    }

    if (activeTab === "translations-en") {
      return <TranslationsEditor lang="en" />;
    }

    if (activeTab === "translations-pl") {
      return <TranslationsEditor lang="pl" />;
    }

    if (activeTab.startsWith("page-")) {
      const pageName = activeTab.replace("page-", "");
      const pageData = getNestedValue(formData, ["pages", pageName]) as any;

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h3 className="text-[15px] font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>Page: {pageName}</h3>
            <button
              onClick={() => removePage(pageName)}
              className="px-3 py-1 text-xs rounded transition-colors"
              style={{ background: 'rgba(220,38,38,0.15)', color: '#ff6b6b', border: '1px solid rgba(220,38,38,0.2)' }}
            >
              Delete Page
            </button>
          </div>

          <div className="flex gap-4 items-start">
            <label className="w-24 flex-shrink-0 text-[13px] pt-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Title</label>
            <input
              type="text"
              value={pageData?.title || ""}
              onChange={(e) => handleChange(["pages", pageName, "title"], { formData: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md text-[13px] transition-colors focus:outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.9)' }}
            />
          </div>

          <div className="pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-medium" style={{ color: 'rgba(255,255,255,0.7)' }}>Sections ({pageData?.sections?.length || 0})</h4>
              <button
                onClick={() => addSection(pageName)}
                className="px-3 py-1 text-xs rounded transition-colors"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                + Add Section
              </button>
            </div>

            {pageData?.sections?.map((section: any, index: number) => {
              const savedPageData = getNestedValue(savedDataRef.current, ["pages", pageName]) as any;
              const savedSection = savedPageData?.sections?.[index];
              return (
                <SectionEditor
                  key={index}
                  section={section}
                  savedSection={savedSection}
                  index={index}
                  sectionCount={pageData.sections.length}
                  pageName={pageName}
                  businessId={businessId}
                  onUpdate={(updatedSection) => {
                    const newSections = [...pageData.sections];
                    newSections[index] = updatedSection;
                    handleChange(["pages", pageName, "sections"], { formData: newSections });
                  }}
                  onRemove={() => removeSection(pageName, index)}
                  onMoveUp={() => moveSection(pageName, index, 'up')}
                  onMoveDown={() => moveSection(pageName, index, 'down')}
                />
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  // --- Sidebar nav item ---
  const NavItem = ({ tab, onClick }: { tab: { id: TabType; label: string; icon?: React.ReactNode }; onClick: () => void }) => {
    const isActive = activeTab === tab.id;
    const changed = isTabChanged(tab.id);

    return (
      <button
        onClick={onClick}
        className={`w-full flex items-center justify-between px-3 py-[6px] text-[13px] rounded-md transition-all ${
          isActive
            ? "bg-white/[0.08] text-white font-medium"
            : "text-white/50 hover:bg-white/[0.04] hover:text-white/80"
        }`}
      >
        <span className="flex items-center gap-2 truncate">
          {tab.icon && <span className="flex-shrink-0 opacity-60">{tab.icon}</span>}
          <span className="truncate">{tab.label}</span>
        </span>
        {changed && !isActive && (
          <span
            onClick={(e) => { e.stopPropagation(); revertTab(tab.id); }}
            title="Revert"
            className="ml-1.5 w-[6px] h-[6px] rounded-full bg-amber-400 flex-shrink-0 hover:bg-red-400 cursor-pointer"
          />
        )}
        {changed && isActive && (
          <span
            onClick={(e) => { e.stopPropagation(); revertTab(tab.id); }}
            title="Revert"
            className="ml-1.5 text-[10px] text-white/40 hover:text-white/80 cursor-pointer flex-shrink-0"
          >undo</span>
        )}
      </button>
    );
  };

  return (
    <div className="flex h-full" style={{ gap: 0 }}>
      {/* Left Sidebar */}
      <div className="flex-shrink-0 flex flex-col" style={{ width: 200, background: '#1d1d1d', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-5">

          {/* Config */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Config</span>
            </div>
            <div className="space-y-px">
              {tabs.filter(t => ["meta", "theme", "navbar", "footer"].includes(t.id)).map((tab) => (
                <NavItem
                  key={tab.id}
                  tab={tab}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (typeof (window as any).navigatePreview === "function") {
                      (window as any).navigatePreview("home");
                    }
                  }}
                />
              ))}
            </div>
          </div>

          {/* Pages */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Pages</span>
              <span className="text-white/20 text-[11px]">+</span>
            </div>
            <div className="space-y-px">
              {tabs.filter(t => t.id.startsWith("page-")).map((tab, tabIdx, arr) => {
                const pageName = tab.id.replace("page-", "");
                return (
                  <div key={tab.id} className="flex items-center">
                    <div className="flex flex-col flex-shrink-0">
                      <button
                        disabled={tabIdx === 0}
                        onClick={() => movePage(pageName, 'up')}
                        className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed p-0 leading-none"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                      </button>
                      <button
                        disabled={tabIdx === arr.length - 1}
                        onClick={() => movePage(pageName, 'down')}
                        className="text-white/30 hover:text-white/70 disabled:opacity-20 disabled:cursor-not-allowed p-0 leading-none"
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <NavItem
                        tab={tab}
                        onClick={() => {
                          setActiveTab(tab.id);
                          if (typeof (window as any).navigatePreview === "function") {
                            (window as any).navigatePreview(pageName);
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 px-1">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="New page..."
                  className="flex-1 min-w-0 px-2 py-1 text-xs rounded transition-colors focus:outline-none"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.7)' }}
                  onKeyDown={(e) => e.key === "Enter" && addPage()}
                />
                <button
                  onClick={addPage}
                  className="px-2 py-1 text-xs rounded transition-colors"
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                >+</button>
              </div>
            </div>
          </div>

          {/* Translations */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <span className="text-[11px] font-semibold text-white/30 uppercase tracking-wider">Translations</span>
            </div>
            <div className="space-y-px">
              {tabs.filter(t => t.id.startsWith("translations-")).map((tab) => (
                <NavItem
                  key={tab.id}
                  tab={tab}
                  onClick={() => setActiveTab(tab.id)}
                />
              ))}
            </div>
          </div>
        </nav>

        {/* Bottom actions - pinned */}
        <div className="p-3 space-y-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !hasUnsavedChanges}
            className="w-full py-2 text-[13px] font-medium text-white rounded-md hover:opacity-90 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
            style={{ background: 'var(--primary)' }}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Changes"}
          </button>

          {hasUnsavedChanges && (
            <button
              onClick={revertAll}
              className="w-full py-1.5 text-[12px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.35)' }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}
            >
              Discard all changes
            </button>
          )}

          <div className="flex items-center justify-center gap-1.5 pt-0.5">
            {saveStatus === "success" && (
              <>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: '#4cd964' }} />
                <span className="text-[11px]" style={{ color: '#4cd964' }}>Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="w-[5px] h-[5px] rounded-full" style={{ background: '#ff6b6b' }} />
                <span className="text-[11px]" style={{ color: '#ff6b6b' }}>{errorMessage}</span>
              </>
            )}
            {saveStatus === "idle" && hasUnsavedChanges && (
              <>
                <span className="w-[5px] h-[5px] bg-amber-400 rounded-full" />
                <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.35)' }}>Unsaved changes</span>
              </>
            )}
            {saveStatus === "idle" && !hasUnsavedChanges && (
              <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.2)' }}>All changes saved</span>
            )}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0 overflow-y-auto" style={{ background: '#252525' }}>
        <div className="p-5">
          {getTabContent()}
        </div>
      </div>
    </div>
  );
}
