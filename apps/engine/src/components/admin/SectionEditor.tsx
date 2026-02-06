import { ImageUploadField } from "./widgets/ImageUploadField";

const VARIANT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  hero: [
    { value: "default", label: "Default" },
    { value: "split", label: "Split" },
    { value: "gradient", label: "Gradient" },
    { value: "cards", label: "Cards" },
    { value: "video", label: "Video" },
    { value: "minimal", label: "Minimal" },
  ],
  services: [
    { value: "grid", label: "Grid" },
    { value: "list", label: "List" },
  ],
  categories: [
    { value: "carousel", label: "Carousel" },
    { value: "featured", label: "Featured" },
  ],
  about: [
    { value: "story", label: "Story" },
    { value: "timeline", label: "Timeline" },
  ],
  contact: [
    { value: "centered", label: "Centered" },
    { value: "split", label: "Split" },
  ],
  shop: [
    { value: "grid", label: "Grid" },
  ],
  gallery: [
    { value: "default", label: "Default" },
  ],
  testimonials: [
    { value: "default", label: "Default" },
  ],
};

interface SectionEditorProps {
  section: any;
  savedSection?: any;
  index: number;
  pageName: string;
  businessId: string;
  onUpdate: (updatedSection: any) => void;
  onRemove: () => void;
}

// Helper to create a field updater
function useFieldUpdater(section: any, onUpdate: (s: any) => void) {
  return {
    set: (field: string, value: any) => onUpdate({ ...section, [field]: value }),
    setHeader: (field: string, value: any) =>
      onUpdate({ ...section, header: { ...section.header, [field]: value } }),
    setNested: (parent: string, field: string, value: any) =>
      onUpdate({ ...section, [parent]: { ...section[parent], [field]: value } }),
  };
}

// --- Highlight helpers ---

function postHighlight(type: 'highlight-section' | 'highlight-field' | 'clear-highlight', index?: number, field?: string) {
  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
  if (iframe?.contentWindow) {
    iframe.contentWindow.postMessage({ source: 'admin-panel', type, index, field }, '*');
  }
}

function fieldHoverProps(sectionIndex: number, fieldPath: string) {
  return {
    onMouseEnter: () => postHighlight('highlight-field', sectionIndex, fieldPath),
    onMouseLeave: () => postHighlight('clear-highlight'),
  };
}

// --- Revert button icon ---
function RevertButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Revert to saved"
      className="p-1 text-amber-500 hover:text-red-500 transition-colors flex-shrink-0"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
      </svg>
    </button>
  );
}

// --- Shared field components ---

function TextField({ label, value, savedValue, onChange, placeholder, sectionIndex, fieldPath }: {
  label: string; value: string; savedValue?: string; onChange: (v: string) => void; placeholder?: string;
  sectionIndex?: number; fieldPath?: string;
}) {
  const changed = savedValue !== undefined && value !== savedValue;
  const hover = sectionIndex != null && fieldPath ? fieldHoverProps(sectionIndex, fieldPath) : {};
  return (
    <div className="flex gap-4 items-center" {...hover}>
      <label className="w-24 flex-shrink-0 text-sm text-gray-600">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 px-3 py-2 border rounded-md text-sm ${changed ? "border-amber-400 bg-amber-50" : "border-gray-300"}`}
      />
      {changed && <RevertButton onClick={() => onChange(savedValue)} />}
    </div>
  );
}

function ImageField({ label, value, savedValue, onChange, businessId, placeholder, sectionIndex, fieldPath }: {
  label: string; value: string; savedValue?: string; onChange: (v: string) => void; businessId: string; placeholder?: string;
  sectionIndex?: number; fieldPath?: string;
}) {
  const changed = savedValue !== undefined && value !== savedValue;
  const hover = sectionIndex != null && fieldPath ? fieldHoverProps(sectionIndex, fieldPath) : {};
  return (
    <div className="flex gap-4 items-start" {...hover}>
      <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">{label}</label>
      <ImageUploadField value={value} onChange={onChange} businessId={businessId} placeholder={placeholder} />
      {changed && <div className="pt-2"><RevertButton onClick={() => onChange(savedValue)} /></div>}
    </div>
  );
}

// --- Header fields (shared by all section types) ---

function HeaderFields({ section, savedSection, updater, si }: { section: any; savedSection?: any; updater: ReturnType<typeof useFieldUpdater>; si: number }) {
  return (
    <>
      <TextField label="Badge" value={section.header?.badge || ""} savedValue={savedSection?.header?.badge || ""} onChange={(v) => updater.setHeader("badge", v)} sectionIndex={si} fieldPath="header.badge" />
      <TextField label="Title" value={section.header?.title || ""} savedValue={savedSection?.header?.title || ""} onChange={(v) => updater.setHeader("title", v)} sectionIndex={si} fieldPath="header.title" />
      <TextField label="Subtitle" value={section.header?.subtitle || ""} savedValue={savedSection?.header?.subtitle || ""} onChange={(v) => updater.setHeader("subtitle", v)} sectionIndex={si} fieldPath="header.subtitle" />
    </>
  );
}

// --- CTA fields ---

function CtaFields({ section, savedSection, onUpdate, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; si: number }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Call to Action</span>
      <TextField
        label="CTA Label"
        value={section.cta?.label || ""}
        savedValue={savedSection?.cta?.label || ""}
        onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, label: v } })}
        sectionIndex={si} fieldPath="cta"
      />
      <TextField
        label="CTA Target"
        value={section.cta?.target || ""}
        savedValue={savedSection?.cta?.target || ""}
        onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, target: v } })}
        sectionIndex={si} fieldPath="cta"
      />
      <TextField
        label="CTA 2 Label"
        value={section.secondaryCta?.label || ""}
        savedValue={savedSection?.secondaryCta?.label || ""}
        onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, label: v } })}
        sectionIndex={si} fieldPath="secondaryCta"
      />
      <TextField
        label="CTA 2 Target"
        value={section.secondaryCta?.target || ""}
        savedValue={savedSection?.secondaryCta?.target || ""}
        onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, target: v } })}
        sectionIndex={si} fieldPath="secondaryCta"
      />
    </div>
  );
}

// --- Items editor (services, categories) ---

function ItemsEditor({ section, onUpdate, businessId, fields, si, fieldPrefix = "items" }: {
  section: any;
  onUpdate: (s: any) => void;
  businessId: string;
  fields: { key: string; label: string; type: "text" | "image" }[];
  si: number;
  fieldPrefix?: string;
}) {
  const items = section.items || [];

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate({ ...section, items: newItems });
  };

  const addItem = () => {
    onUpdate({ ...section, items: [...items, { title: "New Item" }] });
  };

  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    onUpdate({ ...section, items: newItems });
  };

  return (
    <div className="mt-3 pt-3 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Items ({items.length})</span>
        <button onClick={addItem} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">+ Add Item</button>
      </div>
      {items.map((item: any, idx: number) => (
        <div
          key={idx}
          className="mb-3 p-3 bg-white border border-gray-200 rounded space-y-2"
          {...fieldHoverProps(si, `${fieldPrefix}.${idx}`)}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
            <button onClick={() => removeItem(idx)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
          </div>
          {fields.map((f) =>
            f.type === "image" ? (
              <ImageField key={f.key} label={f.label} value={item[f.key] || ""} onChange={(v) => updateItem(idx, f.key, v)} businessId={businessId} sectionIndex={si} fieldPath={`${fieldPrefix}.${idx}.${f.key}`} />
            ) : (
              <TextField key={f.key} label={f.label} value={item[f.key] || ""} onChange={(v) => updateItem(idx, f.key, v)} sectionIndex={si} fieldPath={`${fieldPrefix}.${idx}.${f.key}`} />
            )
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-400 italic">No items yet</p>}
    </div>
  );
}

// --- Type-specific field renderers ---

function HeroFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ImageField label="Image" value={section.image || ""} savedValue={savedSection?.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} sectionIndex={si} fieldPath="image" />
      <ImageField label="Background" value={section.backgroundImage || ""} savedValue={savedSection?.backgroundImage || ""} onChange={(v) => updater.set("backgroundImage", v)} businessId={businessId} placeholder="Background image URL" sectionIndex={si} fieldPath="backgroundImage" />
      <CtaFields section={section} savedSection={savedSection} onUpdate={onUpdate} si={si} />
    </>
  );
}

function ServicesFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ItemsEditor section={section} onUpdate={onUpdate} businessId={businessId} si={si} fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "icon", label: "Icon", type: "image" },
      ]} />
    </>
  );
}

function CategoriesFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ItemsEditor section={section} onUpdate={onUpdate} businessId={businessId} si={si} fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "text" },
        { key: "image", label: "Image", type: "image" },
        { key: "icon", label: "Icon", type: "image" },
        { key: "href", label: "Link", type: "text" },
      ]} />
    </>
  );
}

function AboutFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  const variant = section.variant || "story";

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ImageField label="Image" value={section.image || ""} savedValue={savedSection?.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} sectionIndex={si} fieldPath="image" />

      {variant === "story" && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Story</span>
          <TextField label="Title" value={section.story?.title || ""} savedValue={savedSection?.story?.title || ""} onChange={(v) => updater.setNested("story", "title", v)} sectionIndex={si} fieldPath="story.title" />
          <TextField label="Content" value={section.story?.content || ""} savedValue={savedSection?.story?.content || ""} onChange={(v) => updater.setNested("story", "content", v)} sectionIndex={si} fieldPath="story.content" />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block pt-2">Commitment</span>
          <TextField label="Title" value={section.commitment?.title || ""} savedValue={savedSection?.commitment?.title || ""} onChange={(v) => updater.setNested("commitment", "title", v)} sectionIndex={si} fieldPath="commitment.title" />
          <TextField label="Content" value={section.commitment?.content || ""} savedValue={savedSection?.commitment?.content || ""} onChange={(v) => updater.setNested("commitment", "content", v)} sectionIndex={si} fieldPath="commitment.content" />
        </div>
      )}

      {variant === "timeline" && (
        <ItemsEditor section={{ ...section, items: section.timeline }} onUpdate={(s) => onUpdate({ ...section, timeline: s.items })} businessId={businessId} si={si} fieldPrefix="timeline" fields={[
          { key: "year", label: "Year", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "text" },
        ]} />
      )}

      {/* Stats editor */}
      <ItemsEditor section={{ ...section, items: section.stats }} onUpdate={(s) => onUpdate({ ...section, stats: s.items })} businessId={businessId} si={si} fieldPrefix="stats" fields={[
        { key: "value", label: "Value", type: "text" },
        { key: "label", label: "Label", type: "text" },
      ]} />
    </>
  );
}

function ContactFields({ section, savedSection, onUpdate, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />

      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Form</span>
        <TextField label="Name Label" value={section.form?.nameLabel || ""} savedValue={savedSection?.form?.nameLabel || ""} onChange={(v) => updater.setNested("form", "nameLabel", v)} sectionIndex={si} fieldPath="form.nameLabel" />
        <TextField label="Email Label" value={section.form?.emailLabel || ""} savedValue={savedSection?.form?.emailLabel || ""} onChange={(v) => updater.setNested("form", "emailLabel", v)} sectionIndex={si} fieldPath="form.emailLabel" />
        <TextField label="Msg Label" value={section.form?.messageLabel || ""} savedValue={savedSection?.form?.messageLabel || ""} onChange={(v) => updater.setNested("form", "messageLabel", v)} sectionIndex={si} fieldPath="form.messageLabel" />
        <TextField label="Submit Btn" value={section.form?.submitButton || ""} savedValue={savedSection?.form?.submitButton || ""} onChange={(v) => updater.setNested("form", "submitButton", v)} sectionIndex={si} fieldPath="form.submitButton" />
      </div>

      {section.variant === "split" && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Info</span>
          <TextField label="Address" value={section.info?.address || ""} savedValue={savedSection?.info?.address || ""} onChange={(v) => updater.setNested("info", "address", v)} sectionIndex={si} fieldPath="info.address" />
          <TextField label="Phone" value={section.info?.phone || ""} savedValue={savedSection?.info?.phone || ""} onChange={(v) => updater.setNested("info", "phone", v)} sectionIndex={si} fieldPath="info.phone" />
          <TextField label="Email" value={section.info?.email || ""} savedValue={savedSection?.info?.email || ""} onChange={(v) => updater.setNested("info", "email", v)} sectionIndex={si} fieldPath="info.email" />
          <TextField label="Hours" value={section.info?.hours || ""} savedValue={savedSection?.info?.hours || ""} onChange={(v) => updater.setNested("info", "hours", v)} sectionIndex={si} fieldPath="info.hours" />
        </div>
      )}
    </>
  );
}

function ShopFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  const products = section.products || [];

  const updateProduct = (idx: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[idx] = { ...newProducts[idx], [field]: value };
    onUpdate({ ...section, products: newProducts });
  };

  const addProduct = () => {
    onUpdate({ ...section, products: [...products, { name: "New Product", price: 0, description: "" }] });
  };

  const removeProduct = (idx: number) => {
    const newProducts = [...products];
    newProducts.splice(idx, 1);
    onUpdate({ ...section, products: newProducts });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Products ({products.length})</span>
          <button onClick={addProduct} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">+ Add Product</button>
        </div>
        {products.map((product: any, pIdx: number) => (
          <div
            key={pIdx}
            className="mb-3 p-3 bg-white border border-gray-200 rounded space-y-2"
            {...fieldHoverProps(si, `products.${pIdx}`)}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Product {pIdx + 1}</span>
              <button onClick={() => removeProduct(pIdx)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
            </div>
            <TextField label="Name" value={product.name || ""} onChange={(v) => updateProduct(pIdx, "name", v)} sectionIndex={si} fieldPath={`products.${pIdx}.name`} />
            <div className="flex gap-4 items-center" {...fieldHoverProps(si, `products.${pIdx}.price`)}>
              <label className="w-24 flex-shrink-0 text-sm text-gray-600">Price</label>
              <input
                type="number"
                value={product.price || ""}
                onChange={(e) => updateProduct(pIdx, "price", parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <TextField label="Description" value={product.description || ""} onChange={(v) => updateProduct(pIdx, "description", v)} sectionIndex={si} fieldPath={`products.${pIdx}.description`} />
            <ImageField label="Image" value={product.image || ""} onChange={(v) => updateProduct(pIdx, "image", v)} businessId={businessId} sectionIndex={si} fieldPath={`products.${pIdx}.image`} />
          </div>
        ))}
        {products.length === 0 && <p className="text-xs text-gray-400 italic">No products yet</p>}
      </div>
    </>
  );
}

function DefaultFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ImageField label="Image" value={section.image || ""} savedValue={savedSection?.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} sectionIndex={si} fieldPath="image" />
      <ImageField label="Background" value={section.backgroundImage || ""} savedValue={savedSection?.backgroundImage || ""} onChange={(v) => updater.set("backgroundImage", v)} businessId={businessId} sectionIndex={si} fieldPath="backgroundImage" />
    </>
  );
}

// --- Main component ---

export default function SectionEditor({ section, savedSection, index, pageName, businessId, onUpdate, onRemove }: SectionEditorProps) {
  const variants = VARIANT_OPTIONS[section.type] || [];

  const handleTypeChange = (newType: string) => {
    const defaultVariant = VARIANT_OPTIONS[newType]?.[0]?.value || "default";
    onUpdate({ ...section, type: newType, variant: defaultVariant });
  };

  // Per-field revert for type and variant
  const typeChanged = savedSection && section.type !== savedSection.type;
  const variantChanged = savedSection && section.variant !== savedSection.variant;

  const renderTypeFields = () => {
    const props = { section, savedSection, onUpdate, businessId, si: index };
    switch (section.type) {
      case "hero": return <HeroFields {...props} />;
      case "services": return <ServicesFields {...props} />;
      case "categories": return <CategoriesFields {...props} />;
      case "about": return <AboutFields {...props} />;
      case "contact": return <ContactFields {...props} />;
      case "shop": return <ShopFields {...props} />;
      default: return <DefaultFields {...props} />;
    }
  };

  return (
    <div
      className="mb-4 p-4 border rounded-lg bg-gray-50"
      onMouseEnter={() => postHighlight('highlight-section', index)}
      onMouseLeave={() => postHighlight('clear-highlight')}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm">Section {index + 1}: {section.type}</span>
        <button onClick={onRemove} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Remove</button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 items-center">
          <label className="w-24 flex-shrink-0 text-sm text-gray-600">Type</label>
          <select
            value={section.type || "hero"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${typeChanged ? "border-amber-400 bg-amber-50" : "border-gray-300"}`}
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
          {typeChanged && <RevertButton onClick={() => onUpdate({ ...section, type: savedSection.type, variant: savedSection.variant })} />}
        </div>

        <div className="flex gap-4 items-center">
          <label className="w-24 flex-shrink-0 text-sm text-gray-600">Variant</label>
          <select
            value={section.variant || variants[0]?.value || "default"}
            onChange={(e) => onUpdate({ ...section, variant: e.target.value })}
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${variantChanged ? "border-amber-400 bg-amber-50" : "border-gray-300"}`}
          >
            {variants.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          {variantChanged && <RevertButton onClick={() => onUpdate({ ...section, variant: savedSection.variant })} />}
        </div>

        {renderTypeFields()}
      </div>
    </div>
  );
}
