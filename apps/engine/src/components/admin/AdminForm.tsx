import { useState, useCallback, useEffect, useRef } from "react";
import rjsfCore from "@rjsf/core";
import rjsfValidator from "@rjsf/validator-ajv8";
import type { RJSFSchema } from "@rjsf/utils";
import { ColorPickerWidget } from "./widgets/ColorPickerWidget";
import { ImageUrlWidget } from "./widgets/ImageUrlWidget";
import { ImageUploadField } from "./widgets/ImageUploadField";

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

// Translation files use FLAT keys like "hero.title", not nested objects
// So we don't need to flatten/unflatten - just work with flat structure directly

export default function AdminForm({ businessId, initialData, schema, translations }: AdminFormProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(initialData);
  const [translationsData, setTranslationsData] = useState({
    en: translations?.en || {},
    pl: translations?.pl || {},
  });

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

  const tabs: { id: TabType; label: string }[] = [
    { id: "meta", label: "Business Info" },
    { id: "theme", label: "Theme" },
    { id: "navbar", label: "Navbar" },
    { id: "footer", label: "Footer" },
    ...pageNames.map((name) => ({ id: `page-${name}` as TabType, label: name })),
    { id: "translations-en", label: "EN" },
    { id: "translations-pl", label: "PL" },
  ];

  const handleChange = useCallback((path: string[], data: { formData?: unknown }) => {
    if (data.formData !== undefined) {
      setFormData((prev) => setNestedValue(prev, path, data.formData));
      setSaveStatus("idle");
    }
  }, []);

  const handleSave = async () => {
    setSaveStatus("saving");
    setErrorMessage(undefined);

    console.log("Validated JSON:", JSON.stringify(formData, null, 2));
    console.log("Translations EN:", JSON.stringify(translationsData.en, null, 2));
    console.log("Translations PL:", JSON.stringify(translationsData.pl, null, 2));

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
    // Switch tab first before updating data
    setActiveTab("meta");
    // Use setTimeout to ensure tab switch happens before data update
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

  // Translations editor component with grouping
  // Translation files use FLAT keys like "hero.title", not nested objects
  const TranslationsEditor = ({ lang }: { lang: "en" | "pl" }) => {
    const translations = (translationsData[lang] || {}) as Record<string, string>;
    const keys = Object.keys(translations).sort();

    // Group keys by first part (before first dot)
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
          schemaVersion: schema.properties?.schemaVersion,
          business: schema.properties?.business,
        },
        definitions: schema.definitions,
      };
      return (
        <div className="rjsf-wrapper">
          <Form
            schema={metaSchema}
            formData={{ schemaVersion: formData.schemaVersion, business: formData.business }}
            validator={validator}
            widgets={configWidgets}
            formContext={{ businessId }}
            onChange={(data: any) => {
              if (data.formData) {
                setFormData((prev) => ({
                  ...prev,
                  schemaVersion: data.formData.schemaVersion,
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
      const themeSchema = getSubSchema(schema, ["theme"]);
      return (
        <div className="rjsf-wrapper">
          <Form
            schema={themeSchema}
            formData={getNestedValue(formData, ["theme"])}
            validator={validator}
            widgets={configWidgets}
            formContext={{ businessId }}
            onChange={(data: any) => handleChange(["theme"], data)}
            liveValidate={false}
          ><></></Form>
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
          <div className="flex items-center justify-between pb-4 border-b">
            <h3 className="text-lg font-semibold">Page: {pageName}</h3>
            <button
              onClick={() => removePage(pageName)}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Delete Page
            </button>
          </div>

          <div className="flex gap-4 items-start">
            <label className="w-32 flex-shrink-0 text-sm font-medium text-gray-700 pt-2">Title</label>
            <input
              type="text"
              value={pageData?.title || ""}
              onChange={(e) => handleChange(["pages", pageName, "title"], { formData: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
            />
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium">Sections ({pageData?.sections?.length || 0})</h4>
              <button
                onClick={() => addSection(pageName)}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                + Add Section
              </button>
            </div>

            {pageData?.sections?.map((section: any, index: number) => (
              <div key={index} className="mb-4 p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-sm">Section {index + 1}: {section.type}</span>
                  <button
                    onClick={() => removeSection(pageName, index)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Type</label>
                    <select
                      value={section.type || "hero"}
                      onChange={(e) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = { ...section, type: e.target.value };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="hero">Hero</option>
                      <option value="services">Services</option>
                      <option value="categories">Categories</option>
                      <option value="about">About</option>
                      <option value="contact">Contact</option>
                      <option value="gallery">Gallery</option>
                      <option value="testimonials">Testimonials</option>
                      <option value="shop">Shop</option>
                    </select>
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Variant</label>
                    <input
                      type="text"
                      value={section.variant || ""}
                      onChange={(e) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = { ...section, variant: e.target.value };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Title</label>
                    <input
                      type="text"
                      value={section.header?.title || ""}
                      onChange={(e) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = {
                          ...section,
                          header: { ...section.header, title: e.target.value },
                        };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Subtitle</label>
                    <input
                      type="text"
                      value={section.header?.subtitle || ""}
                      onChange={(e) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = {
                          ...section,
                          header: { ...section.header, subtitle: e.target.value },
                        };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Badge</label>
                    <input
                      type="text"
                      value={section.header?.badge || ""}
                      onChange={(e) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = {
                          ...section,
                          header: { ...section.header, badge: e.target.value },
                        };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Image</label>
                    <ImageUploadField
                      value={section.image || ""}
                      businessId={businessId}
                      onChange={(url) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = { ...section, image: url };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                    />
                  </div>

                  <div className="flex gap-4 items-start">
                    <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Background</label>
                    <ImageUploadField
                      value={section.backgroundImage || ""}
                      businessId={businessId}
                      placeholder="Background image URL"
                      onChange={(url) => {
                        const newSections = [...pageData.sections];
                        newSections[index] = { ...section, backgroundImage: url };
                        handleChange(["pages", pageName, "sections"], { formData: newSections });
                      }}
                    />
                  </div>

                  {/* Products editor for shop sections */}
                  {section.type === "shop" && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-medium text-gray-700">Products</label>
                        <button
                          onClick={() => {
                            const newSections = [...pageData.sections];
                            const products = section.products || [];
                            newSections[index] = {
                              ...section,
                              products: [...products, { name: "New Product", price: 0, description: "" }],
                            };
                            handleChange(["pages", pageName, "sections"], { formData: newSections });
                          }}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          + Add Product
                        </button>
                      </div>
                      {(section.products || []).map((product: any, pIdx: number) => (
                        <div key={pIdx} className="mb-3 p-3 bg-white border border-gray-200 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500">Product {pIdx + 1}</span>
                            <button
                              onClick={() => {
                                const newSections = [...pageData.sections];
                                const newProducts = [...section.products];
                                newProducts.splice(pIdx, 1);
                                newSections[index] = { ...section, products: newProducts };
                                handleChange(["pages", pageName, "sections"], { formData: newSections });
                              }}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder="Product name"
                              value={product.name || ""}
                              onChange={(e) => {
                                const newSections = [...pageData.sections];
                                const newProducts = [...section.products];
                                newProducts[pIdx] = { ...product, name: e.target.value };
                                newSections[index] = { ...section, products: newProducts };
                                handleChange(["pages", pageName, "sections"], { formData: newSections });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                            <div className="flex gap-2">
                              <input
                                type="number"
                                placeholder="Price"
                                value={product.price || ""}
                                onChange={(e) => {
                                  const newSections = [...pageData.sections];
                                  const newProducts = [...section.products];
                                  newProducts[pIdx] = { ...product, price: parseFloat(e.target.value) || 0 };
                                  newSections[index] = { ...section, products: newProducts };
                                  handleChange(["pages", pageName, "sections"], { formData: newSections });
                                }}
                                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                              <input
                                type="text"
                                placeholder="Image URL"
                                value={product.image || ""}
                                onChange={(e) => {
                                  const newSections = [...pageData.sections];
                                  const newProducts = [...section.products];
                                  newProducts[pIdx] = { ...product, image: e.target.value };
                                  newSections[index] = { ...section, products: newProducts };
                                  handleChange(["pages", pageName, "sections"], { formData: newSections });
                                }}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded"
                              />
                            </div>
                            <input
                              type="text"
                              placeholder="Description"
                              value={product.description || ""}
                              onChange={(e) => {
                                const newSections = [...pageData.sections];
                                const newProducts = [...section.products];
                                newProducts[pIdx] = { ...product, description: e.target.value };
                                newSections[index] = { ...section, products: newProducts };
                                handleChange(["pages", pageName, "sections"], { formData: newSections });
                              }}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>
                      ))}
                      {(!section.products || section.products.length === 0) && (
                        <p className="text-xs text-gray-400 italic">No products yet</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="flex gap-6">
      {/* Left Sidebar */}
      <div className="w-48 flex-shrink-0 space-y-4">
        {/* Config Section */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-slate-100 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Config</span>
          </div>
          <div className="p-1 space-y-0.5">
            {tabs.filter(t => ["meta", "theme", "navbar", "footer"].includes(t.id)).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  if (typeof (window as any).navigatePreview === "function") {
                    (window as any).navigatePreview("home");
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-all ${
                  activeTab === tab.id
                    ? "bg-slate-700 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Translations Section */}
        <div className="bg-white border border-emerald-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-emerald-50 border-b border-emerald-200">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Translations</span>
          </div>
          <div className="p-1 space-y-0.5">
            {tabs.filter(t => t.id.startsWith("translations-")).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-all ${
                  activeTab === tab.id
                    ? "bg-emerald-600 text-white"
                    : "text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Pages Section */}
        <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
          <div className="px-3 py-2 bg-amber-50 border-b border-amber-200">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pages</span>
          </div>
          <div className="p-1 space-y-0.5">
            {tabs.filter(t => t.id.startsWith("page-")).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  const pageName = tab.id.replace("page-", "");
                  if (typeof (window as any).navigatePreview === "function") {
                    (window as any).navigatePreview(pageName);
                  }
                }}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded transition-all ${
                  activeTab === tab.id
                    ? "bg-amber-600 text-white"
                    : "text-amber-700 hover:bg-amber-100"
                }`}
              >
                {tab.label.replace("Page: ", "")}
              </button>
            ))}
            <div className="pt-2 px-1">
              <div className="flex gap-1">
                <input
                  type="text"
                  value={newPageName}
                  onChange={(e) => setNewPageName(e.target.value)}
                  placeholder="New page"
                  className="flex-1 min-w-0 px-2 py-1 text-xs border border-amber-300 rounded"
                  onKeyDown={(e) => e.key === "Enter" && addPage()}
                />
                <button
                  onClick={addPage}
                  className="px-2 py-1 text-xs bg-amber-500 text-white rounded hover:bg-amber-600"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving" || !hasUnsavedChanges}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveStatus === "saving" ? "Saving..." : "Save"}
          </button>

          <div className="flex items-center justify-center gap-2 py-2">
            {saveStatus === "success" && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600">Saved</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-xs text-red-500">{errorMessage}</span>
              </>
            )}
            {saveStatus === "idle" && hasUnsavedChanges && (
              <>
                <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                <span className="text-xs text-amber-600">Unsaved changes</span>
              </>
            )}
            {saveStatus === "idle" && !hasUnsavedChanges && (
              <>
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400">All changes saved</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right Content */}
      <div className="flex-1 min-w-0">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {getTabContent()}
        </div>
      </div>
    </div>
  );
}
