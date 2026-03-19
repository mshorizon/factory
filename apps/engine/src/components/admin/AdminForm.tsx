import { useState, useCallback, useEffect, useRef } from "react";
import RjsfForm from "@rjsf/shadcn";
import rjsfValidator from "@rjsf/validator-ajv8";
import type { RJSFSchema } from "@rjsf/utils";
import { ColorPickerWidget } from "./widgets/ColorPickerWidget";
import { ImageUrlWidget } from "./widgets/ImageUrlWidget";
import { ObjectFieldTemplate, FieldTemplate } from "./RjsfTemplates";
import SectionEditor from "./SectionEditor";
import { BlogManagement } from "./BlogManagement";
import { ProductsTab } from "./ProductsTab";
import { ServicesTab } from "./ServicesTab";
import { Button } from "@/components/ui/button";
import { ButtonGroup, ButtonGroupText, ButtonGroupSeparator } from "@/components/ui/button-group";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarInset,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import {
  Moon,
  Sun,
  FileText,
  Palette,
  Menu,
  Footprints,
  Database,
  FileEdit,
  Languages,
  File,
  Save,
  Undo2,
  Check,
  AlertCircle,
  Circle,
  ExternalLink,
  Briefcase,
  User2,
  ChevronsUpDown,
  ShoppingBag,
  Wrench,
} from "lucide-react";

// Handle CJS/ESM interop
const Form = (RjsfForm as any).default || RjsfForm;
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

const customTemplates = {
  ObjectFieldTemplate,
  FieldTemplate,
};

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
  return { ...current, definitions: schema.definitions } as RJSFSchema;
}

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

export default function AdminForm({
  businessId,
  initialData,
  schema,
  translations,
}: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [translationsData, setTranslationsData] = useState({
    en: translations?.en || {},
    pl: translations?.pl || {},
  });

  const savedDataRef = useRef<Record<string, unknown>>(structuredClone(initialData));
  const savedTransRef = useRef({ en: translations?.en || {}, pl: translations?.pl || {} });

  const [internalActiveTab, setInternalActiveTab] = useState<TabType>(() => {
    if (typeof window !== "undefined") {
      return (sessionStorage.getItem(`admin-tab-${businessId}`) as TabType) || "meta";
    }
    return "meta";
  });

  const activeTab = internalActiveTab;
  const setActiveTab = (tab: TabType) => setInternalActiveTab(tab);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [newPageName, setNewPageName] = useState("");

  const [metaSubTab, setMetaSubTab] = useState<"business" | "assets">("business");
  const [themeSubTab, setThemeSubTab] = useState<"colors" | "typography">("colors");

  useEffect(() => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`admin-tab-${businessId}`, activeTab);
    }
  }, [activeTab, businessId]);

  const pages = formData.pages as Record<string, unknown> | undefined;
  const pageNames = pages ? Object.keys(pages) : [];

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    setHasUnsavedChanges(true);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const res = await fetch("/api/admin/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId, data: formData, translations: translationsData }),
        });
        if (!res.ok) throw new Error("Draft update failed");
        setSaveStatus("idle");
        if (typeof (window as any).refreshPreview === "function") {
          (window as any).refreshPreview();
        }
      } catch (err) {
        setSaveStatus("error");
        setErrorMessage("Preview update failed");
      }
    }, 800);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [formData, translationsData, businessId]);

  const isTabChanged = useCallback((tabId: string): boolean => {
    if (!tabId || typeof tabId !== "string") return false;
    const saved = savedDataRef.current;
    const savedTrans = savedTransRef.current;

    if (tabId === "meta") return !deepEqual(formData.business, saved.business);
    if (tabId === "theme") return !deepEqual(formData.theme, saved.theme);
    if (tabId === "navbar") return !deepEqual(getNestedValue(formData, ["layout", "navbar"]), getNestedValue(saved, ["layout", "navbar"]));
    if (tabId === "footer") return !deepEqual(getNestedValue(formData, ["layout", "footer"]), getNestedValue(saved, ["layout", "footer"]));
    if (tabId === "data-products") return !deepEqual(getNestedValue(formData, ["data", "products"]), getNestedValue(saved, ["data", "products"]));
    if (tabId === "data-services") return !deepEqual(getNestedValue(formData, ["data", "services"]), getNestedValue(saved, ["data", "services"]));
    if (tabId === "translations-en") return !deepEqual(translationsData.en, savedTrans.en);
    if (tabId === "translations-pl") return !deepEqual(translationsData.pl, savedTrans.pl);
    if (tabId.startsWith("page-")) {
      const pageName = tabId.replace("page-", "");
      return !deepEqual(getNestedValue(formData, ["pages", pageName]), getNestedValue(saved, ["pages", pageName]));
    }
    return false;
  }, [formData, translationsData]);

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

      savedDataRef.current = structuredClone(formData);
      savedTransRef.current = structuredClone(translationsData);
      setHasUnsavedChanges(false);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);

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
        [pageName]: { title: newPageName.trim(), sections: [] },
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
            sections: [...(page.sections || []), { type: "hero", variant: "default", header: { title: "New Section" } }],
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
      return { ...prev, pages: { ...pages, [pageName]: { ...page, sections: newSections } } };
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
      return { ...prev, pages: { ...pages, [pageName]: { ...page, sections } } };
    });
  };

  // Translations editor
  const TranslationsEditor = ({ lang }: { lang: "en" | "pl" }) => {
    const translations = (translationsData[lang] || {}) as Record<string, string>;
    const keys = Object.keys(translations).sort();

    const groups: Record<string, string[]> = {};
    for (const key of keys) {
      const firstPart = key.split(".")[0];
      if (!groups[firstPart]) groups[firstPart] = [];
      groups[firstPart].push(key);
    }
    const groupNames = Object.keys(groups).sort();

    const handleTranslationChange = (key: string, value: string) => {
      setTranslationsData((prev) => ({
        ...prev,
        [lang]: { ...(prev[lang] as Record<string, string>), [key]: value },
      }));
      setSaveStatus("idle");
    };

    return (
      <div className="space-y-6">
        {groupNames.map((groupName) => (
          <div key={groupName} className="border border-border rounded-lg overflow-hidden">
            <div className="bg-muted/30 px-4 py-2 border-b border-border">
              <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">{groupName}</h4>
            </div>
            <div className="p-4 space-y-3">
              {groups[groupName].map((key) => (
                <div key={key} className="flex gap-4 items-start">
                  <label className="w-48 flex-shrink-0 text-sm pt-2 break-all text-muted-foreground">
                    {key.substring(groupName.length + 1) || key}
                  </label>
                  <input
                    type="text"
                    value={translations[key] ?? ""}
                    onChange={(e) => handleTranslationChange(key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {keys.length === 0 && <p className="text-sm text-muted-foreground">No translations found.</p>}
      </div>
    );
  };

  const getTabContent = () => {
    if (activeTab === "meta") {
      const businessSchema = schema.properties?.business as any;

      const businessInfoSchema: RJSFSchema = {
        type: "object",
        properties: {
          business: {
            type: "object",
            properties: {
              id: businessSchema?.properties?.id,
              name: businessSchema?.properties?.name,
              industry: businessSchema?.properties?.industry,
              serviceArea: businessSchema?.properties?.serviceArea,
              contact: businessSchema?.properties?.contact,
              socials: businessSchema?.properties?.socials,
              trustSignals: businessSchema?.properties?.trustSignals,
              googleRating: businessSchema?.properties?.googleRating,
            },
          },
        },
        definitions: schema.definitions,
      };

      const assetsSchema: RJSFSchema = {
        type: "object",
        properties: {
          business: {
            type: "object",
            properties: { assets: businessSchema?.properties?.assets },
          },
        },
        definitions: schema.definitions,
      };

      return (
        <Tabs value={metaSubTab} onValueChange={(v) => setMetaSubTab(v as "business" | "assets")} orientation="horizontal">
          <TabsList className="mb-6">
            <TabsTrigger value="business">Business Info</TabsTrigger>
            <TabsTrigger value="assets">Assets</TabsTrigger>
          </TabsList>

          <TabsContent value="business" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <Form
                  schema={businessInfoSchema}
                  uiSchema={generateColorUiSchema(businessInfoSchema)}
                  formData={{ business: formData.business }}
                  validator={validator}
                  widgets={configWidgets}
                  templates={customTemplates}
                  formContext={{ businessId }}
                  onChange={(data: any) => {
                    if (data.formData) {
                      setFormData((prev) => ({
                        ...prev,
                        business: { ...(prev.business as Record<string, unknown>), ...data.formData.business },
                      }));
                      setSaveStatus("idle");
                    }
                  }}
                  liveValidate={false}
                ><></></Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assets" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <Form
                  schema={assetsSchema}
                  uiSchema={generateColorUiSchema(assetsSchema)}
                  formData={{ business: { assets: (formData.business as any)?.assets } }}
                  validator={validator}
                  widgets={configWidgets}
                  templates={customTemplates}
                  formContext={{ businessId }}
                  onChange={(data: any) => {
                    if (data.formData) {
                      setFormData((prev) => ({
                        ...prev,
                        business: { ...(prev.business as Record<string, unknown>), assets: data.formData.business?.assets },
                      }));
                      setSaveStatus("idle");
                    }
                  }}
                  liveValidate={false}
                ><></></Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    if (activeTab === "theme") {
      const themeData = (formData.theme || {}) as Record<string, any>;
      const currentMode: "light" | "dark" = themeData.mode || "light";

      const ensureDarkColors = () => {
        const colors = themeData.colors || {};
        if (!colors.dark || !colors.dark.primary) {
          const lightColors = colors.light || {};
          handleChange(["theme", "colors", "dark"], { formData: structuredClone(lightColors) });
        }
      };

      const toggleMode = (mode: "light" | "dark") => {
        if (mode === "dark") ensureDarkColors();
        handleChange(["theme", "mode"], { formData: mode });
      };

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

      const uiSchema: RJSFSchema = {
        type: "object",
        properties: {
          ui: schema.properties?.theme ? (schema.properties.theme as any).properties?.ui : undefined,
        },
        definitions: schema.definitions,
      };

      const typographySchema: RJSFSchema = {
        type: "object",
        properties: {
          preset: schema.properties?.theme ? (schema.properties.theme as any).properties?.preset : undefined,
          typography: schema.properties?.theme ? (schema.properties.theme as any).properties?.typography : undefined,
        },
        definitions: schema.definitions,
      };

      const colorData = getNestedValue(formData, ["theme", "colors", currentMode]) || {};

      return (
        <Tabs value={themeSubTab} onValueChange={(v) => setThemeSubTab(v as "colors" | "typography")} orientation="horizontal">
          <TabsList className="mb-6">
            <TabsTrigger value="colors">Colors & UI</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
          </TabsList>

          <TabsContent value="colors" className="space-y-6 mt-0">
            <div className="flex items-center justify-between px-1 py-3 border-b border-border">
              <span className="text-[13px] font-medium text-muted-foreground">Color Mode</span>
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                <button
                  onClick={() => toggleMode("light")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentMode === "light" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Light
                </button>
                <button
                  onClick={() => toggleMode("dark")}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${currentMode === "dark" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Dark
                </button>
              </div>
            </div>

            <Card>
              <CardContent className="pt-6">
                <Form
                  key={currentMode}
                  schema={colorModeSchema}
                  uiSchema={generateColorUiSchema(colorModeSchema)}
                  formData={colorData}
                  validator={validator}
                  widgets={configWidgets}
                  templates={customTemplates}
                  formContext={{ businessId }}
                  onChange={(data: any) => handleChange(["theme", "colors", currentMode], data)}
                  liveValidate={false}
                ><></></Form>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <Form
                  schema={uiSchema}
                  formData={{ ui: themeData.ui }}
                  validator={validator}
                  widgets={configWidgets}
                  templates={customTemplates}
                  formContext={{ businessId }}
                  onChange={(data: any) => {
                    if (data.formData) {
                      setFormData((prev) => ({
                        ...prev,
                        theme: { ...(prev.theme as Record<string, unknown>), ui: data.formData.ui },
                      }));
                      setSaveStatus("idle");
                    }
                  }}
                  liveValidate={false}
                ><></></Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="typography" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <Form
                  schema={typographySchema}
                  formData={{ preset: themeData.preset, typography: themeData.typography }}
                  validator={validator}
                  widgets={configWidgets}
                  templates={customTemplates}
                  formContext={{ businessId }}
                  onChange={(data: any) => {
                    if (data.formData) {
                      setFormData((prev) => ({
                        ...prev,
                        theme: { ...(prev.theme as Record<string, unknown>), preset: data.formData.preset, typography: data.formData.typography },
                      }));
                      setSaveStatus("idle");
                    }
                  }}
                  liveValidate={false}
                ><></></Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      );
    }

    if (activeTab === "navbar") {
      const navbarSchema = getSubSchema(schema, ["layout", "navbar"]);
      return (
        <Card>
          <CardContent className="pt-6">
            <Form
              schema={navbarSchema}
              formData={getNestedValue(formData, ["layout", "navbar"])}
              validator={validator}
              widgets={configWidgets}
              templates={customTemplates}
              formContext={{ businessId }}
              onChange={(data: any) => handleChange(["layout", "navbar"], data)}
              liveValidate={false}
            ><></></Form>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "footer") {
      const footerSchema = getSubSchema(schema, ["layout", "footer"]);
      return (
        <Card>
          <CardContent className="pt-6">
            <Form
              schema={footerSchema}
              formData={getNestedValue(formData, ["layout", "footer"])}
              validator={validator}
              widgets={configWidgets}
              templates={customTemplates}
              formContext={{ businessId }}
              onChange={(data: any) => handleChange(["layout", "footer"], data)}
              liveValidate={false}
            ><></></Form>
          </CardContent>
        </Card>
      );
    }

    if (activeTab === "data-products") {
      const dataContent = getNestedValue(formData, ["data"]) || {};
      const products = (dataContent.products || []) as any[];

      return (
        <ProductsTab
          products={products}
          onChange={(newProducts) => {
            setFormData((prev) => ({
              ...prev,
              data: { ...(prev.data as Record<string, unknown>), products: newProducts },
            }));
            setSaveStatus("idle");
          }}
        />
      );
    }

    if (activeTab === "data-services") {
      const dataContent = getNestedValue(formData, ["data"]) || {};
      const services = (dataContent.services || []) as any[];

      return (
        <ServicesTab
          services={services}
          onChange={(newServices) => {
            setFormData((prev) => ({
              ...prev,
              data: { ...(prev.data as Record<string, unknown>), services: newServices },
            }));
            setSaveStatus("idle");
          }}
        />
      );
    }

    if (activeTab === "blog") {
      return <BlogManagement businessId={businessId} />;
    }

    if (activeTab === "translations-en") return <TranslationsEditor lang="en" />;
    if (activeTab === "translations-pl") return <TranslationsEditor lang="pl" />;

    if (activeTab.startsWith("page-")) {
      const pageName = activeTab.replace("page-", "");
      const pageData = getNestedValue(formData, ["pages", pageName]) as any;

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <h3 className="text-[15px] font-semibold">Page: {pageName}</h3>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => removePage(pageName)}
            >
              Delete Page
            </Button>
          </div>

          <div className="flex gap-4 items-start">
            <label className="w-24 flex-shrink-0 text-[13px] pt-2 text-muted-foreground">Title</label>
            <input
              type="text"
              value={pageData?.title || ""}
              onChange={(e) => handleChange(["pages", pageName, "title"], { formData: e.target.value })}
              className="flex-1 px-3 py-2 rounded-md text-[13px] focus:outline-none bg-background border border-border focus:ring-2 focus:ring-ring/20"
            />
          </div>

          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[13px] font-medium text-muted-foreground">Sections ({pageData?.sections?.length || 0})</h4>
              <Button size="sm" variant="outline" onClick={() => addSection(pageName)}>
                + Add Section
              </Button>
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

  const navGroups = [
    {
      label: "General",
      items: [
        { id: "meta", label: "Business", Icon: Briefcase },
      ],
    },
    {
      label: "Data",
      items: [
        { id: "data-products", label: "Products", Icon: ShoppingBag },
        { id: "data-services", label: "Services", Icon: Wrench },
        { id: "blog", label: "Blog", Icon: FileEdit },
      ],
    },
    {
      label: "Layout",
      items: [
        { id: "theme", label: "Theme", Icon: Palette },
        { id: "navbar", label: "Navbar", Icon: Menu },
        { id: "footer", label: "Footer", Icon: Footprints },
      ],
    },
  ];

  const [theme, setThemeState] = useState<"light" | "dark">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("admin-theme") as "light" | "dark") || "light";
    }
    return "light";
  });

  const setTheme = useCallback((newTheme: "light" | "dark") => {
    setThemeState(newTheme);
    localStorage.setItem("admin-theme", newTheme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(newTheme);
  }, []);

  // Apply theme on mount
  useEffect(() => {
    const saved = (localStorage.getItem("admin-theme") as "light" | "dark") || "light";
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(saved);
    setThemeState(saved);
  }, []);

  // Badge helper – small muted count pill like shadcn dashboard tabs
  const CountBadge = ({ count }: { count: number }) => (
    <span className="ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">
      {count}
    </span>
  );

  const faviconUrl = (formData.business as any)?.assets?.favicon;

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={true}>
        {/* ── Sidebar ───────────────────────────────── */}
        <Sidebar collapsible="icon" className="border-r border-sidebar-border">
          <SidebarHeader className="h-[49px] min-h-[49px] border-b border-sidebar-border !flex-row items-center">
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors p-2 mx-2 w-full group-data-[collapsible=icon]:justify-center"
              style={{ marginLeft: 8, marginRight: 8 }}
            >
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm overflow-hidden bg-background">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="" className="h-full w-full object-contain" />
                ) : (
                  <Briefcase className="h-3 w-3" />
                )}
              </div>
              <span className="text-base font-semibold whitespace-nowrap group-data-[collapsible=icon]:hidden">{businessId}</span>
            </a>
          </SidebarHeader>

          <SidebarContent>
            {navGroups.map((group) => (
              <SidebarGroup key={group.label}>
                <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
                <SidebarMenu>
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.id}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                      >
                        <item.Icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            ))}

            {pageNames.length > 0 && (
              <SidebarGroup>
                <SidebarGroupLabel>Pages</SidebarGroupLabel>
                <SidebarMenu>
                  {pageNames.map((pageName) => {
                    return (
                      <SidebarMenuItem key={`page-${pageName}`}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(`page-${pageName}`)}
                          isActive={activeTab === `page-${pageName}`}
                        >
                          <File />
                          <span>{pageName}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroup>
            )}

            <SidebarGroup>
              <SidebarGroupLabel>Translations</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveTab("translations-en")}
                    isActive={activeTab === "translations-en"}
                  >
                    <Languages />
                    <span>English</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => setActiveTab("translations-pl")}
                    isActive={activeTab === "translations-pl"}
                  >
                    <Languages />
                    <span>Polski</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                    AU
                  </div>
                  <div className="flex flex-col flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate text-xs font-medium">Admin User</span>
                    <span className="truncate text-[11px] text-muted-foreground">admin@hazelgrouse.pl</span>
                  </div>
                  <ChevronsUpDown className="ml-auto text-muted-foreground group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main content ──────────────────────────── */}
        <SidebarInset>
          <header className="flex items-center h-[49px] px-4 border-b border-sidebar-border bg-background shrink-0">
            {/* Left: breadcrumb */}
            <Breadcrumb className="mr-auto h-[49px] flex items-center">
              <BreadcrumbList>
                {(() => {
                  // Find which navGroup contains the active tab
                  for (const group of navGroups) {
                    const item = group.items.find((i) => i.id === activeTab);
                    if (item) {
                      return (
                        <>
                          <BreadcrumbItem>
                            <span className="text-muted-foreground">{group.label}</span>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>{item.label}</BreadcrumbPage>
                          </BreadcrumbItem>
                        </>
                      );
                    }
                  }
                  if (activeTab.startsWith("page-")) {
                    const pageName = activeTab.replace("page-", "");
                    return (
                      <>
                        <BreadcrumbItem>
                          <span className="text-muted-foreground">Pages</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{pageName}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    );
                  }
                  if (activeTab === "translations-en" || activeTab === "translations-pl") {
                    return (
                      <>
                        <BreadcrumbItem>
                          <span className="text-muted-foreground">Translations</span>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{activeTab === "translations-en" ? "English" : "Polski"}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    );
                  }
                  return (
                    <BreadcrumbItem>
                      <BreadcrumbPage>Admin</BreadcrumbPage>
                    </BreadcrumbItem>
                  );
                })()}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Right: two button groups */}
            <div className="flex items-center gap-2 h-[49px]">
              {/* Group 1: Open site */}
              <ButtonGroup className="h-8">
                <Button variant="ghost" size="sm" asChild className="rounded-none border-0">
                  <a href="/" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1" />
                    Open site
                  </a>
                </Button>
              </ButtonGroup>

              {/* Group 2: Status + Discard + Save */}
              <ButtonGroup className="h-8">
                <ButtonGroupText>
                  {saveStatus === "success" && <><Check className="h-3.5 w-3.5 text-green-600" /><span className="text-green-600">Saved</span></>}
                  {saveStatus === "error" && <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{errorMessage}</span></>}
                  {saveStatus === "idle" && hasUnsavedChanges && <><Circle className="h-2 w-2 fill-amber-500 text-amber-500" />Unsaved</>}
                  {saveStatus === "idle" && !hasUnsavedChanges && <>Up to date</>}
                </ButtonGroupText>
                {hasUnsavedChanges && (
                  <>
                    <ButtonGroupSeparator />
                    <Button variant="ghost" size="sm" onClick={revertAll} className="rounded-none border-0">
                      <Undo2 className="h-3.5 w-3.5 mr-1" />
                      Discard
                    </Button>
                  </>
                )}
                <ButtonGroupSeparator />
                <Button
                  onClick={handleSave}
                  disabled={saveStatus === "saving" || !hasUnsavedChanges}
                  size="sm"
                  className="rounded-none border-0"
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saveStatus === "saving" ? "Saving..." : "Save"}
                </Button>
              </ButtonGroup>
            </div>
          </header>

          {/* Content area */}
          <div className="flex-1 overflow-y-auto admin-form-area">
            <div className="p-6">
              {getTabContent()}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
