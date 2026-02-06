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

// --- Shared field components ---

function TextField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
      />
    </div>
  );
}

function ImageField({ label, value, onChange, businessId, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; businessId: string; placeholder?: string;
}) {
  return (
    <div className="flex gap-4 items-start">
      <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">{label}</label>
      <ImageUploadField value={value} onChange={onChange} businessId={businessId} placeholder={placeholder} />
    </div>
  );
}

// --- Header fields (shared by all section types) ---

function HeaderFields({ section, updater }: { section: any; updater: ReturnType<typeof useFieldUpdater> }) {
  return (
    <>
      <TextField label="Badge" value={section.header?.badge || ""} onChange={(v) => updater.setHeader("badge", v)} />
      <TextField label="Title" value={section.header?.title || ""} onChange={(v) => updater.setHeader("title", v)} />
      <TextField label="Subtitle" value={section.header?.subtitle || ""} onChange={(v) => updater.setHeader("subtitle", v)} />
    </>
  );
}

// --- CTA fields ---

function CtaFields({ section, onUpdate }: { section: any; onUpdate: (s: any) => void }) {
  return (
    <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Call to Action</span>
      <TextField
        label="CTA Label"
        value={section.cta?.label || ""}
        onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, label: v } })}
      />
      <TextField
        label="CTA Target"
        value={section.cta?.target || ""}
        onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, target: v } })}
      />
      <TextField
        label="CTA 2 Label"
        value={section.secondaryCta?.label || ""}
        onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, label: v } })}
      />
      <TextField
        label="CTA 2 Target"
        value={section.secondaryCta?.target || ""}
        onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, target: v } })}
      />
    </div>
  );
}

// --- Items editor (services, categories) ---

function ItemsEditor({ section, onUpdate, businessId, fields }: {
  section: any;
  onUpdate: (s: any) => void;
  businessId: string;
  fields: { key: string; label: string; type: "text" | "image" }[];
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
        <div key={idx} className="mb-3 p-3 bg-white border border-gray-200 rounded space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">Item {idx + 1}</span>
            <button onClick={() => removeItem(idx)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
          </div>
          {fields.map((f) =>
            f.type === "image" ? (
              <ImageField key={f.key} label={f.label} value={item[f.key] || ""} onChange={(v) => updateItem(idx, f.key, v)} businessId={businessId} />
            ) : (
              <TextField key={f.key} label={f.label} value={item[f.key] || ""} onChange={(v) => updateItem(idx, f.key, v)} />
            )
          )}
        </div>
      ))}
      {items.length === 0 && <p className="text-xs text-gray-400 italic">No items yet</p>}
    </div>
  );
}

// --- Type-specific field renderers ---

function HeroFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} updater={updater} />
      <ImageField label="Image" value={section.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} />
      <ImageField label="Background" value={section.backgroundImage || ""} onChange={(v) => updater.set("backgroundImage", v)} businessId={businessId} placeholder="Background image URL" />
      <CtaFields section={section} onUpdate={onUpdate} />
    </>
  );
}

function ServicesFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} updater={updater} />
      <ItemsEditor section={section} onUpdate={onUpdate} businessId={businessId} fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "text" },
        { key: "price", label: "Price", type: "text" },
        { key: "icon", label: "Icon", type: "image" },
      ]} />
    </>
  );
}

function CategoriesFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} updater={updater} />
      <ItemsEditor section={section} onUpdate={onUpdate} businessId={businessId} fields={[
        { key: "title", label: "Title", type: "text" },
        { key: "description", label: "Description", type: "text" },
        { key: "image", label: "Image", type: "image" },
        { key: "icon", label: "Icon", type: "image" },
        { key: "href", label: "Link", type: "text" },
      ]} />
    </>
  );
}

function AboutFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);
  const variant = section.variant || "story";

  return (
    <>
      <HeaderFields section={section} updater={updater} />
      <ImageField label="Image" value={section.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} />

      {variant === "story" && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Story</span>
          <TextField label="Title" value={section.story?.title || ""} onChange={(v) => updater.setNested("story", "title", v)} />
          <TextField label="Content" value={section.story?.content || ""} onChange={(v) => updater.setNested("story", "content", v)} />
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide block pt-2">Commitment</span>
          <TextField label="Title" value={section.commitment?.title || ""} onChange={(v) => updater.setNested("commitment", "title", v)} />
          <TextField label="Content" value={section.commitment?.content || ""} onChange={(v) => updater.setNested("commitment", "content", v)} />
        </div>
      )}

      {variant === "timeline" && (
        <ItemsEditor section={{ ...section, items: section.timeline }} onUpdate={(s) => onUpdate({ ...section, timeline: s.items })} businessId={businessId} fields={[
          { key: "year", label: "Year", type: "text" },
          { key: "title", label: "Title", type: "text" },
          { key: "description", label: "Description", type: "text" },
        ]} />
      )}

      {/* Stats editor */}
      <ItemsEditor section={{ ...section, items: section.stats }} onUpdate={(s) => onUpdate({ ...section, stats: s.items })} businessId={businessId} fields={[
        { key: "value", label: "Value", type: "text" },
        { key: "label", label: "Label", type: "text" },
      ]} />
    </>
  );
}

function ContactFields({ section, onUpdate }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);

  return (
    <>
      <HeaderFields section={section} updater={updater} />

      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Form</span>
        <TextField label="Name Label" value={section.form?.nameLabel || ""} onChange={(v) => updater.setNested("form", "nameLabel", v)} />
        <TextField label="Email Label" value={section.form?.emailLabel || ""} onChange={(v) => updater.setNested("form", "emailLabel", v)} />
        <TextField label="Msg Label" value={section.form?.messageLabel || ""} onChange={(v) => updater.setNested("form", "messageLabel", v)} />
        <TextField label="Submit Btn" value={section.form?.submitButton || ""} onChange={(v) => updater.setNested("form", "submitButton", v)} />
      </div>

      {section.variant === "split" && (
        <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Contact Info</span>
          <TextField label="Address" value={section.info?.address || ""} onChange={(v) => updater.setNested("info", "address", v)} />
          <TextField label="Phone" value={section.info?.phone || ""} onChange={(v) => updater.setNested("info", "phone", v)} />
          <TextField label="Email" value={section.info?.email || ""} onChange={(v) => updater.setNested("info", "email", v)} />
          <TextField label="Hours" value={section.info?.hours || ""} onChange={(v) => updater.setNested("info", "hours", v)} />
        </div>
      )}
    </>
  );
}

function ShopFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
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
      <HeaderFields section={section} updater={updater} />

      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Products ({products.length})</span>
          <button onClick={addProduct} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200">+ Add Product</button>
        </div>
        {products.map((product: any, pIdx: number) => (
          <div key={pIdx} className="mb-3 p-3 bg-white border border-gray-200 rounded space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Product {pIdx + 1}</span>
              <button onClick={() => removeProduct(pIdx)} className="text-xs text-red-600 hover:text-red-800">Remove</button>
            </div>
            <TextField label="Name" value={product.name || ""} onChange={(v) => updateProduct(pIdx, "name", v)} />
            <div className="flex gap-4 items-start">
              <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Price</label>
              <input
                type="number"
                value={product.price || ""}
                onChange={(e) => updateProduct(pIdx, "price", parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>
            <TextField label="Description" value={product.description || ""} onChange={(v) => updateProduct(pIdx, "description", v)} />
            <ImageField label="Image" value={product.image || ""} onChange={(v) => updateProduct(pIdx, "image", v)} businessId={businessId} />
          </div>
        ))}
        {products.length === 0 && <p className="text-xs text-gray-400 italic">No products yet</p>}
      </div>
    </>
  );
}

function DefaultFields({ section, onUpdate, businessId }: { section: any; onUpdate: (s: any) => void; businessId: string }) {
  const updater = useFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} updater={updater} />
      <ImageField label="Image" value={section.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} />
      <ImageField label="Background" value={section.backgroundImage || ""} onChange={(v) => updater.set("backgroundImage", v)} businessId={businessId} />
    </>
  );
}

// --- Main component ---

export default function SectionEditor({ section, index, pageName, businessId, onUpdate, onRemove }: SectionEditorProps) {
  const variants = VARIANT_OPTIONS[section.type] || [];

  const handleTypeChange = (newType: string) => {
    const defaultVariant = VARIANT_OPTIONS[newType]?.[0]?.value || "default";
    onUpdate({ ...section, type: newType, variant: defaultVariant });
  };

  const renderTypeFields = () => {
    const props = { section, onUpdate, businessId };
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
    <div className="mb-4 p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm">Section {index + 1}: {section.type}</span>
        <button onClick={onRemove} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">Remove</button>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 items-start">
          <label className="w-24 flex-shrink-0 text-sm text-gray-600 pt-2">Type</label>
          <select
            value={section.type || "hero"}
            onChange={(e) => handleTypeChange(e.target.value)}
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
          <select
            value={section.variant || variants[0]?.value || "default"}
            onChange={(e) => onUpdate({ ...section, variant: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            {variants.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
        </div>

        {renderTypeFields()}
      </div>
    </div>
  );
}
