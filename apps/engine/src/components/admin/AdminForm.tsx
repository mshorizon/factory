import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import RjsfForm from "@rjsf/shadcn";
import rjsfValidator from "@rjsf/validator-ajv8";
import type { RJSFSchema } from "@rjsf/utils";
import { ColorPickerWidget } from "./widgets/ColorPickerWidget";
import { ImageUrlWidget } from "./widgets/ImageUrlWidget";
import { ObjectFieldTemplate, FieldTemplate } from "./RjsfTemplates";
import SectionEditor from "./SectionEditor";
import { BlogManagement } from "./BlogManagement";
import { ProjectManagement } from "./ProjectManagement";
import { ProductsTab } from "./ProductsTab";
import { ServicesTab } from "./ServicesTab";
import { NotificationsTab } from "./NotificationsTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { StatusTab } from "./StatusTab";
import { OverviewTab } from "./OverviewTab";
import { OrdersTab } from "./OrdersTab";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Copy,
  Briefcase,
  User2,
  ChevronsUpDown,
  ShoppingBag,
  Wrench,
  Star,
  Loader2,
  Trash2,
  Bell,
  MoreHorizontal,
  BarChart2,
  FolderKanban,
  LogOut,
  Users,
  Shield,
  Plus,
  KeyRound,
  Activity,
  LayoutDashboard,
  Receipt,
} from "lucide-react";

// Handle CJS/ESM interop
const Form = (RjsfForm as any).default || RjsfForm;
const validator = (rjsfValidator as any).default || rjsfValidator;

const SUPPORTED_LANGS = ["en", "pl", "de", "uk"] as const;
const LANG_LABELS: Record<string, string> = { en: "English", pl: "Polski", de: "Deutsch", uk: "Українська" };
const langLabel = (lang: string) => LANG_LABELS[lang] || lang.toUpperCase();

interface AdminFormProps {
  businessId: string;
  initialData: Record<string, unknown>;
  schema: RJSFSchema;
  translations?: Record<string, Record<string, unknown>>;
  auth?: { email: string; role: string; userId: number } | null;
}

type SaveStatus = "idle" | "saving" | "success" | "error";
type TabType = "meta" | "theme" | "navbar" | "footer" | "translations" | string;

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

function resolveTranslations(obj: any, translations: Record<string, string>): any {
  if (typeof obj === "string" && obj.startsWith("t:")) {
    const key = obj.slice(2);
    return translations[key] ?? obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => resolveTranslations(item, translations));
  }
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = resolveTranslations(value, translations);
    }
    return result;
  }
  return obj;
}

function reconstructWithTKeys(orig: any, updated: any): any {
  if (typeof orig === "string" && orig.startsWith("t:")) {
    return orig; // Keep the t: key reference
  }
  if (Array.isArray(orig) && Array.isArray(updated)) {
    return updated.map((item, i) => {
      if (i < orig.length) return reconstructWithTKeys(orig[i], item);
      return item;
    });
  }
  if (orig && updated && typeof orig === "object" && typeof updated === "object") {
    const result: any = { ...updated };
    for (const key of Object.keys(orig)) {
      if (key in updated) {
        result[key] = reconstructWithTKeys(orig[key], updated[key]);
      }
    }
    return result;
  }
  return updated;
}

function UsersPanel({ currentUserId }: { currentUserId?: number }) {
  const [users, setUsers] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ email: '', password: '', role: 'admin', businessId: '' });
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => { setUsers(d.users || []); setBusinesses(d.businesses || []); })
      .catch(() => setError('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (userId: number) => {
    if (!confirm('Delete this user?')) return;
    await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', userId }) });
    setUsers((u) => u.filter((x) => x.id !== userId));
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const res = await fetch('/api/admin/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create', ...addForm }) });
    const data = await res.json();
    if (data.user) { setUsers((u) => [...u, data.user]); setShowAdd(false); setAddForm({ email: '', password: '', role: 'admin', businessId: '' }); }
    setAdding(false);
  };

  if (loading) return <div className="p-8 text-muted-foreground">Loading users…</div>;
  if (error) return <div className="p-8 text-destructive">{error}</div>;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Users</h2>
          <p className="text-sm text-muted-foreground">{users.length} account{users.length !== 1 ? 's' : ''}</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-4 w-4 mr-1" /> Add user
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader><CardTitle className="text-base">New user</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleAdd} className="space-y-3">
              <input className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Email" type="email" value={addForm.email} onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))} required />
              <input className="w-full border rounded px-3 py-1.5 text-sm" placeholder="Password" type="password" value={addForm.password} onChange={(e) => setAddForm((f) => ({ ...f, password: e.target.value }))} required />
              <select className="w-full border rounded px-3 py-1.5 text-sm" value={addForm.role} onChange={(e) => setAddForm((f) => ({ ...f, role: e.target.value }))}>
                <option value="super-admin">super-admin</option>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
              </select>
              <select className="w-full border rounded px-3 py-1.5 text-sm" value={addForm.businessId} onChange={(e) => setAddForm((f) => ({ ...f, businessId: e.target.value }))}>
                <option value="">No business (super-admin)</option>
                {businesses.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={adding}>{adding ? 'Adding…' : 'Create'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {users.map((user) => (
          <Card key={user.id}>
            <CardContent className="flex items-center gap-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                {user.email.slice(0, 2).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{user.email}</span>
                  {user.id === currentUserId && <Badge variant="secondary" className="text-[10px]">you</Badge>}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="uppercase font-medium">{user.role}</span>
                  {user.businessId && <span>· {user.businessId}</span>}
                  {user.lastLoginAt && <span>· Last login {new Date(user.lastLoginAt).toLocaleDateString()}</span>}
                </div>
              </div>
              {user.id !== currentUserId && (
                <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function AdminForm({
  businessId,
  initialData,
  schema,
  translations,
  auth,
}: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [translationsData, setTranslationsData] = useState<Record<string, Record<string, unknown>>>(() => {
    const result: Record<string, Record<string, unknown>> = {};
    for (const lang of SUPPORTED_LANGS) {
      result[lang] = (translations?.[lang] as Record<string, unknown>) || {};
    }
    return result;
  });

  // Primary language setting (stored in translations._settings)
  const [primaryLanguage, setPrimaryLanguage] = useState<string>(() => {
    const settings = (translations as any)?._settings as Record<string, unknown> | undefined;
    return (settings?.primaryLanguage as string) || "en";
  });

  const savedDataRef = useRef<Record<string, unknown>>(structuredClone(initialData));
  const savedTransRef = useRef<Record<string, Record<string, unknown>>>({
    en: (translations?.en as Record<string, unknown>) || {},
    pl: (translations?.pl as Record<string, unknown>) || {},
    de: (translations?.de as Record<string, unknown>) || {},
    uk: (translations?.uk as Record<string, unknown>) || {},
  });

  const [internalActiveTab, setInternalActiveTab] = useState<TabType>("meta");

  const activeTab = internalActiveTab;
  const setActiveTab = (tab: TabType) => setInternalActiveTab(tab);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [newPageName, setNewPageName] = useState("");

  const [metaSubTab, setMetaSubTab] = useState<"business" | "assets">("business");
  const [themeSubTab, setThemeSubTab] = useState<"colors" | "typography">("colors");
  const [translationsSubTab, setTranslationsSubTab] = useState("en");
  const [translationMode, setTranslationMode] = useState<"keys" | "en" | "pl">("keys");

  // Restore + persist active tab via sessionStorage (client-only, after mount)
  useEffect(() => {
    const saved = sessionStorage.getItem(`admin-tab-${businessId}`);
    if (saved) setInternalActiveTab(saved as TabType);
  }, [businessId]);

  useEffect(() => {
    sessionStorage.setItem(`admin-tab-${businessId}`, activeTab);
  }, [activeTab, businessId]);

  const pages = formData.pages as Record<string, unknown> | undefined;
  const pageNames = pages ? Object.keys(pages) : [];

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);
  const headerRef = useRef<HTMLElement>(null);
  // full(≥820): all visible | no-breadcrumb(≥640): breadcrumb hidden | center-menu(≥480): center in menu | compact(<480): all in menu
  type HeaderMode = 'full' | 'no-breadcrumb' | 'center-menu' | 'compact';
  const [headerMode, setHeaderMode] = useState<HeaderMode>('full');
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      if (w >= 820) setHeaderMode('full');
      else if (w >= 640) setHeaderMode('no-breadcrumb');
      else if (w >= 480) setHeaderMode('center-menu');
      else setHeaderMode('compact');
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [menuOpen]);

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
    if (tabId === "translations") return SUPPORTED_LANGS.some((lang) => !deepEqual(translationsData[lang], savedTrans[lang]));
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

  const resolvedFormData = useMemo(() => {
    if (translationMode === "keys") return formData;
    const lang = translationMode as "en" | "pl";
    return resolveTranslations(formData, (translationsData[lang] || {}) as Record<string, string>);
  }, [formData, translationMode, translationsData]);

  const handleTranslatedChange = useCallback(
    (path: string[], data: { formData?: unknown }) => {
      if (data.formData === undefined) return;
      if (translationMode === "keys") {
        handleChange(path, data);
        return;
      }

      const lang = translationMode as "en" | "pl";
      const originalAtPath = getNestedValue(formData, path);
      const newData = data.formData;

      // Find t: key translations to update
      const translationUpdates: Record<string, string> = {};
      function walk(orig: any, updated: any) {
        if (typeof orig === "string" && orig.startsWith("t:")) {
          if (typeof updated === "string") {
            translationUpdates[orig.slice(2)] = updated;
          }
          return;
        }
        if (Array.isArray(orig) && Array.isArray(updated)) {
          for (let i = 0; i < Math.min(orig.length, updated.length); i++) {
            walk(orig[i], updated[i]);
          }
          return;
        }
        if (orig && updated && typeof orig === "object" && typeof updated === "object") {
          for (const key of Object.keys(orig)) {
            if (key in updated) walk(orig[key], updated[key]);
          }
        }
      }
      walk(originalAtPath, newData);

      if (Object.keys(translationUpdates).length > 0) {
        setTranslationsData((prev) => ({
          ...prev,
          [lang]: { ...(prev[lang] as Record<string, string>), ...translationUpdates },
        }));
      }

      // Reconstruct formData preserving t: keys
      const reconstructed = reconstructWithTKeys(originalAtPath, newData);
      setFormData((prev) => setNestedValue(prev, path, reconstructed));
      setSaveStatus("idle");
    },
    [translationMode, formData, handleChange]
  );

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
        body: JSON.stringify({
          businessId,
          translations: {
            ...translationsData,
            _settings: { primaryLanguage },
          },
        }),
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
  const TranslationsEditor = ({ lang }: { lang: string }) => {
    const translations = (translationsData[lang] || {}) as Record<string, string>;
    const keys = Object.keys(translations).sort();
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [filterInput, setFilterInput] = useState("");
    const [filterQuery, setFilterQuery] = useState("");
    const [translating, setTranslating] = useState(false);
    const filterDebounceRef = useRef<NodeJS.Timeout | null>(null);

    const isPrimary = lang === primaryLanguage;

    const handleFilterInput = (value: string) => {
      setFilterInput(value);
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
      filterDebounceRef.current = setTimeout(() => setFilterQuery(value), 250);
    };

    const clearFilter = () => {
      setFilterInput("");
      setFilterQuery("");
      if (filterDebounceRef.current) clearTimeout(filterDebounceRef.current);
    };

    const filteredKeys = filterQuery.trim()
      ? keys.filter((key) => {
          const q = filterQuery.toLowerCase();
          return key.toLowerCase().includes(q) || (translations[key] ?? "").toLowerCase().includes(q);
        })
      : keys;

    const groups: Record<string, string[]> = {};
    for (const key of filteredKeys) {
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

    const copyKey = (key: string) => {
      navigator.clipboard.writeText(key);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    };

    const handleClearAll = () => {
      if (!confirm("Remove all translations for this language?")) return;
      const cleared: Record<string, string> = {};
      for (const key of keys) cleared[key] = "";
      setTranslationsData((prev) => ({ ...prev, [lang]: cleared }));
      setSaveStatus("idle");
    };

    const handleClearSection = (section: string) => {
      const sectionKeys = Object.keys((translationsData[lang] || {}) as Record<string, string>)
        .filter((k) => k.split(".")[0] === section);
      if (!sectionKeys.length) return;
      const updates: Record<string, string> = {};
      for (const k of sectionKeys) updates[k] = "";
      setTranslationsData((prev) => ({
        ...prev,
        [lang]: { ...(prev[lang] as Record<string, string>), ...updates },
      }));
      setSaveStatus("idle");
    };

    // Translate empty fields from primary language
    const handleTranslateFromPrimary = async () => {
      const primaryTranslations = (translationsData[primaryLanguage] || {}) as Record<string, string>;
      const currentTranslations = (translationsData[lang] || {}) as Record<string, string>;

      // Find all keys from primary that are empty in current lang
      const emptyKeys = Object.keys(primaryTranslations).filter(
        (key) => !currentTranslations[key] || !currentTranslations[key].trim()
      );

      if (emptyKeys.length === 0) {
        alert("All fields are already filled.");
        return;
      }

      setTranslating(true);
      try {
        const textsToTranslate = emptyKeys.map((key) => String(primaryTranslations[key] || ""));

        const response = await fetch("/api/admin/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            texts: textsToTranslate,
            from: primaryLanguage,
            to: lang,
          }),
        });

        if (!response.ok) throw new Error("Translation failed");

        const data = await response.json();
        const updates: Record<string, string> = {};
        emptyKeys.forEach((key, i) => {
          updates[key] = data.translations[i];
        });

        setTranslationsData((prev) => ({
          ...prev,
          [lang]: { ...(prev[lang] as Record<string, string>), ...updates },
        }));
        setSaveStatus("idle");
      } catch (err) {
        alert("Translation error: " + (err instanceof Error ? err.message : "Unknown error"));
      } finally {
        setTranslating(false);
      }
    };

    return (
      <div className="space-y-6">
        {/* Primary language indicator */}
        <div className={`flex items-center justify-between p-3 rounded-lg border ${
          isPrimary
            ? "bg-amber-500/5 border-amber-500/20"
            : "bg-blue-500/5 border-blue-500/20"
        }`}>
          <div className="flex items-center gap-2">
            {isPrimary ? (
              <>
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-medium">Primary language</span>
              </>
            ) : (
              <span className="text-sm font-medium">
                Secondary language — {langLabel(primaryLanguage)} is the primary language
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isPrimary ? (
              <span className="text-xs text-muted-foreground">Change in the other language tab</span>
            ) : (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => { setPrimaryLanguage(lang); setHasUnsavedChanges(true); }}
                    >
                      <Star className="h-3.5 w-3.5 mr-1.5 text-amber-500" />
                      Set as primary
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Set {langLabel(lang)} as the primary language</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleClearAll}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                      Clear all
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove all translations for this language</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleTranslateFromPrimary}
                      disabled={translating}
                    >
                      {translating ? (
                        <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Translating...</>
                      ) : (
                        <><Languages className="h-3.5 w-3.5 mr-1.5" />Translate from primary</>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Only empty fields will be translated</TooltipContent>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <input
            type="text"
            value={filterInput}
            onChange={(e) => handleFilterInput(e.target.value)}
            placeholder="Filter by key or value…"
            className="w-full px-3 py-2 pr-8 border border-border rounded-md text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background"
          />
          {filterInput && (
            <button
              onClick={clearFilter}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear filter"
            >
              ✕
            </button>
          )}
        </div>

        {groupNames.map((groupName) => (
          <Card key={groupName}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm uppercase tracking-wide text-muted-foreground font-semibold">{groupName}</CardTitle>
                {!isPrimary && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => handleClearSection(groupName)}
                        className="flex items-center gap-1 text-xs text-muted-foreground/50 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                        clear
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Clear translations for section "{groupName}"</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {groups[groupName].map((key) => (
                <div key={key} className="flex gap-4 items-start">
                  <Tooltip>
                    <TooltipTrigger
                      className="w-48 flex-shrink-0 text-sm pt-2 break-all text-muted-foreground text-left cursor-pointer hover:text-foreground transition-colors inline-flex items-center gap-1.5 group/key"
                      onClick={() => copyKey(key)}
                    >
                      <span>{key}</span>
                      <Copy className="h-3 w-3 opacity-0 group-hover/key:opacity-100 transition-opacity flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      {copiedKey === key ? "Copied!" : "Copy key"}
                    </TooltipContent>
                  </Tooltip>
                  <input
                    type="text"
                    value={translations[key] ?? ""}
                    onChange={(e) => handleTranslationChange(key, e.target.value)}
                    className="flex-1 px-3 py-2 border border-border rounded-md text-sm focus:border-ring focus:ring-2 focus:ring-ring/20 outline-none bg-background"
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        {filteredKeys.length === 0 && (
          <p className="text-sm text-muted-foreground">
            {keys.length === 0 ? "No translations found." : "No matches for current filter."}
          </p>
        )}
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
            <Form
              schema={businessInfoSchema}
              uiSchema={generateColorUiSchema(businessInfoSchema)}
              formData={{ business: resolvedFormData.business }}
              validator={validator}
              widgets={configWidgets}
              templates={customTemplates}
              formContext={{ businessId }}
              onChange={(data: any) => {
                if (data.formData) {
                  if (translationMode !== "keys") {
                    const origBiz = formData.business as Record<string, unknown>;
                    const newBiz = data.formData.business;
                    const translationUpdates: Record<string, string> = {};
                    const lang = translationMode as "en" | "pl";
                    function walkBiz(orig: any, updated: any) {
                      if (typeof orig === "string" && orig.startsWith("t:")) {
                        if (typeof updated === "string") translationUpdates[orig.slice(2)] = updated;
                        return;
                      }
                      if (orig && updated && typeof orig === "object" && typeof updated === "object") {
                        for (const k of Object.keys(orig)) {
                          if (k in updated) walkBiz(orig[k], updated[k]);
                        }
                      }
                    }
                    walkBiz(origBiz, newBiz);
                    if (Object.keys(translationUpdates).length > 0) {
                      setTranslationsData((prev) => ({
                        ...prev,
                        [lang]: { ...(prev[lang] as Record<string, string>), ...translationUpdates },
                      }));
                    }
                    const reconstructedBiz = reconstructWithTKeys(origBiz, newBiz);
                    setFormData((prev) => ({
                      ...prev,
                      business: { ...(prev.business as Record<string, unknown>), ...reconstructedBiz },
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      business: { ...(prev.business as Record<string, unknown>), ...data.formData.business },
                    }));
                  }
                  setSaveStatus("idle");
                }
              }}
              liveValidate={false}
            ><></></Form>
          </TabsContent>

          <TabsContent value="assets" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                <Form
                  schema={assetsSchema}
                  uiSchema={generateColorUiSchema(assetsSchema)}
                  formData={{ business: { assets: (resolvedFormData.business as any)?.assets } }}
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
              <CardContent className="pt-6 rjsf-grid-2col">
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
              <CardContent className="pt-6 rjsf-grid-2col">
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
          <CardContent className="pt-6 rjsf-grid-2col">
            <Form
              schema={navbarSchema}
              formData={getNestedValue(resolvedFormData, ["layout", "navbar"])}
              validator={validator}
              widgets={configWidgets}
              templates={customTemplates}
              formContext={{ businessId }}
              onChange={(data: any) => handleTranslatedChange(["layout", "navbar"], data)}
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
          <CardContent className="pt-6 rjsf-grid-2col">
            <Form
              schema={footerSchema}
              formData={getNestedValue(resolvedFormData, ["layout", "footer"])}
              validator={validator}
              widgets={configWidgets}
              templates={customTemplates}
              formContext={{ businessId }}
              onChange={(data: any) => handleTranslatedChange(["layout", "footer"], data)}
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
      return <BlogManagement businessId={businessId} primaryLanguage={primaryLanguage} />;
    }
    
    if (activeTab === "projects") {
      return <ProjectManagement businessId={businessId} primaryLanguage={primaryLanguage} />;
    }

    if (activeTab === "orders") {
      return <OrdersTab businessId={businessId} />;
    }

    if (activeTab === "notifications") {
      return (
        <NotificationsTab
          businessId={businessId}
          notifications={(formData.notifications || {}) as any}
          onChange={(notifications) => {
            setFormData((prev) => ({ ...prev, notifications }));
            setSaveStatus("idle");
          }}
        />
      );
    }

    if (activeTab === "analytics") {
      return <AnalyticsTab businessId={businessId} />;
    }

    if (activeTab === "status") {
      return <StatusTab businessId={businessId} />;
    }

    if (activeTab === "translations") {
      return (
        <Tabs value={translationsSubTab} onValueChange={setTranslationsSubTab} orientation="horizontal">
          <TabsList className="mb-6">
            {SUPPORTED_LANGS.map((l) => (
              <TabsTrigger key={l} value={l} className="flex items-center gap-1.5">
                {langLabel(l)}
                {primaryLanguage === l && <Star className="h-3 w-3 text-amber-500 fill-amber-500" />}
              </TabsTrigger>
            ))}
          </TabsList>
          {SUPPORTED_LANGS.map((l) => (
            <TabsContent key={l} value={l} className="mt-0">
              <TranslationsEditor lang={l} />
            </TabsContent>
          ))}
        </Tabs>
      );
    }

    if (activeTab.startsWith("page-")) {
      const pageName = activeTab.replace("page-", "");
      const pageData = getNestedValue(formData, ["pages", pageName]) as any;
      const resolvedPageData = getNestedValue(resolvedFormData, ["pages", pageName]) as any;

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
              value={resolvedPageData?.title || ""}
              onChange={(e) => handleTranslatedChange(["pages", pageName, "title"], { formData: e.target.value })}
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

            {pageData?.sections?.map((_section: any, index: number) => {
              const resolvedSection = resolvedPageData?.sections?.[index] || _section;
              const savedPageData = getNestedValue(savedDataRef.current, ["pages", pageName]) as any;
              const savedSection = savedPageData?.sections?.[index];
              return (
                <SectionEditor
                  key={index}
                  section={resolvedSection}
                  savedSection={savedSection}
                  index={index}
                  sectionCount={pageData.sections.length}
                  pageName={pageName}
                  businessId={businessId}
                  onUpdate={(updatedSection) => {
                    const newSections = [...pageData.sections];
                    newSections[index] = updatedSection;
                    handleTranslatedChange(["pages", pageName, "sections"], { formData: newSections });
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

    if (activeTab === "overview") {
      return <OverviewTab />;
    }

    if (activeTab === "users") return <UsersPanel currentUserId={auth?.userId} />;

    return null;
  };

  const navGroups = [
    {
      label: "General",
      items: [
        { id: "meta", label: "Business", Icon: Briefcase },
        { id: "notifications", label: "Notifications", Icon: Bell },
        { id: "translations", label: "Translations", Icon: Languages },
      ],
    },
    {
      label: "Data",
      items: [
        { id: "data-products", label: "Products", Icon: ShoppingBag },
        { id: "data-services", label: "Services", Icon: Wrench },
        { id: "blog", label: "Blog", Icon: FileEdit },
        { id: "projects", label: "Projects", Icon: FolderKanban },
        { id: "orders", label: "Orders", Icon: Receipt },
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
    {
      label: "Insights",
      items: [
        { id: "analytics", label: "Analytics", Icon: BarChart2 },
        { id: "status", label: "Status", Icon: Activity },
      ],
    },
    ...(auth?.role === "super-admin" ? [
      {
        label: "Overview",
        items: [
          { id: "overview", label: "All Businesses", Icon: LayoutDashboard },
        ],
      },
      {
        label: "Administration",
        items: [
          { id: "users", label: "Users", Icon: Users },
        ],
      },
    ] : []),
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
              className="group/link flex items-center gap-2 rounded-md hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors p-2 mx-2 w-full group-data-[collapsible=icon]:justify-center"
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
              <ExternalLink className="h-3.5 w-3.5 ml-auto opacity-0 group-hover/link:opacity-100 transition-opacity text-muted-foreground group-data-[collapsible=icon]:hidden" />
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
              {auth && (
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<SidebarMenuButton size="lg" className="group/user" />}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold flex-shrink-0">
                        {auth.email.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col flex-1 text-left leading-tight group-data-[collapsible=icon]:hidden min-w-0">
                        <span className="truncate text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{auth.role}</span>
                        <span className="truncate text-[11px] text-muted-foreground">{auth.email}</span>
                      </div>
                      <MoreHorizontal className="ml-auto h-4 w-4 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56 mb-1">
                      <div className="px-2 py-1.5 flex flex-col gap-0.5">
                        <span className="text-xs font-semibold text-foreground">{auth.email}</span>
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{auth.role}</span>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={async () => {
                          await fetch('/api/auth/logout', { method: 'POST' });
                          window.location.href = '/admin/login';
                        }}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* ── Main content ──────────────────────────── */}
        <SidebarInset>
          <header
            ref={headerRef}
            className="grid grid-cols-[1fr_auto_1fr] items-center h-[49px] pl-6 pr-4 border-b border-sidebar-border bg-background shrink-0 min-w-0"
          >
            {/* Col 1: breadcrumb — only in full mode */}
            {headerMode === 'full' ? (
              <Breadcrumb className="min-w-0 overflow-hidden h-[49px] flex items-center">
                <BreadcrumbList className="flex-nowrap overflow-hidden">
                  {(() => {
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
                      const langLabel = activeTab === "translations-en" ? "English" : "Polski";
                      return (
                        <>
                          <BreadcrumbItem>
                            <span className="text-muted-foreground">Translations</span>
                          </BreadcrumbItem>
                          <BreadcrumbSeparator />
                          <BreadcrumbItem>
                            <BreadcrumbPage>{langLabel}</BreadcrumbPage>
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
            ) : <div />}

            {/* Col 2: translation switcher — visible in full + no-breadcrumb, else hidden (goes to menu) */}
            {(headerMode === 'full' || headerMode === 'no-breadcrumb') ? (
              <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                {(["keys", "en", "pl"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTranslationMode(mode)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                      translationMode === mode
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {mode === "keys" ? "Keys" : mode === "en" ? "English" : "Polski"}
                  </button>
                ))}
              </div>
            ) : <div />}

            {/* Col 3: right side — cascades from full buttons → menu icon for center → all in menu */}
            {headerMode === 'compact' ? (
              /* compact: everything (center + buttons) in menu */
              <div className="flex justify-end">
                <div ref={menuRef} className="relative">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setMenuOpen((v) => !v)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 p-1">
                      <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Translation mode</p>
                      {(["keys", "en", "pl"] as const).map((mode) => (
                        <button key={mode} type="button" onClick={() => { setTranslationMode(mode); setMenuOpen(false); }} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent hover:text-accent-foreground">
                          {mode === "keys" ? "Keys" : mode === "en" ? "English" : "Polski"}
                          {translationMode === mode && <Check className="ml-auto h-3.5 w-3.5" />}
                        </button>
                      ))}
                      <div className="my-1 h-px bg-border" />
                      <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">
                        {saveStatus === "error" ? errorMessage || "Error" : saveStatus === "success" ? "Saved" : hasUnsavedChanges ? "Unsaved changes" : "All changes published"}
                      </p>
                      <button type="button" onClick={() => { revertAll(); setMenuOpen(false); }} disabled={!hasUnsavedChanges} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
                        <Undo2 className="h-3.5 w-3.5" />
                        Rollback
                      </button>
                      <button type="button" onClick={() => { handleSave(); setMenuOpen(false); }} disabled={saveStatus === "saving" || !hasUnsavedChanges} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50">
                        <Save className="h-3.5 w-3.5" />
                        {saveStatus === "saving" ? "Publishing..." : "Publish"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : headerMode === 'center-menu' ? (
              /* center-menu: center in menu icon, buttons visible */
              <div className="flex items-center justify-end gap-2">
                <div ref={menuRef} className="relative">
                  <Button type="button" variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setMenuOpen((v) => !v)}>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 p-1">
                      <p className="px-1.5 py-1 text-xs font-medium text-muted-foreground">Translation mode</p>
                      {(["keys", "en", "pl"] as const).map((mode) => (
                        <button key={mode} type="button" onClick={() => { setTranslationMode(mode); setMenuOpen(false); }} className="flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-sm hover:bg-accent hover:text-accent-foreground">
                          {mode === "keys" ? "Keys" : mode === "en" ? "English" : "Polski"}
                          {translationMode === mode && <Check className="ml-auto h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={revertAll} disabled={!hasUnsavedChanges}>
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  Rollback
                </Button>
                <Button onClick={handleSave} disabled={saveStatus === "saving" || !hasUnsavedChanges} size="sm">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saveStatus === "saving" ? "Publishing..." : "Publish"}
                </Button>
              </div>
            ) : (
              /* full / no-breadcrumb: badge + rollback + publish */
              <div className="flex items-center justify-end gap-3 h-[49px]">
                {saveStatus === "error" ? (
                  <Badge className="ml-3 bg-destructive/10 text-destructive border-destructive/20 h-6 rounded-full">
                    <AlertCircle className="h-3 w-3" />
                    {errorMessage || "Error"}
                  </Badge>
                ) : saveStatus === "success" ? (
                  <Badge className="ml-3 bg-green-500/10 text-green-600 border-green-500/20 h-6 rounded-full">
                    <Check className="h-3 w-3" />
                    Saved
                  </Badge>
                ) : hasUnsavedChanges ? (
                  <Badge className="ml-3 bg-amber-500/10 text-amber-600 border-amber-500/20 h-6 rounded-full">
                    <Circle className="h-2 w-2 fill-amber-500" />
                    Unsaved changes
                  </Badge>
                ) : (
                  <Badge className="ml-3 bg-green-500/10 text-green-600 border-green-500/20 h-6 rounded-full">
                    <Check className="h-3 w-3" />
                    All changes published
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={revertAll} disabled={!hasUnsavedChanges}>
                  <Undo2 className="h-3.5 w-3.5 mr-1" />
                  Rollback
                </Button>
                <Button onClick={handleSave} disabled={saveStatus === "saving" || !hasUnsavedChanges} size="sm">
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {saveStatus === "saving" ? "Publishing..." : "Publish"}
                </Button>
              </div>
            )}
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
