import { Button } from "@/components/ui/button";
import { ImageUploadField } from "./widgets/ImageUploadField";
import { ChevronUp, ChevronDown, Trash2, Undo2, Plus } from "lucide-react";

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
    { value: "imageGrid", label: "Image Grid" },
    { value: "featured", label: "Featured" },
    { value: "alternating", label: "Alternating" },
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
  shop: [{ value: "grid", label: "Grid" }],
  gallery: [{ value: "default", label: "Default" }],
  testimonials: [
    { value: "default", label: "Default" },
    { value: "gradient", label: "Gradient" },
  ],
  faq: [
    { value: "default", label: "Default" },
    { value: "bordered", label: "Bordered" },
  ],
  features: [
    { value: "default", label: "Default" },
    { value: "compact", label: "Compact (3-col)" },
    { value: "gradient", label: "Gradient" },
  ],
  ctaBanner: [
    { value: "default", label: "Default" },
    { value: "ticker", label: "Ticker" },
    { value: "card", label: "Card" },
  ],
  blog: [{ value: "default", label: "Default" }],
  process: [
    { value: "default", label: "Default" },
    { value: "visual", label: "Visual" },
    { value: "grid", label: "Grid" },
  ],
  pricing: [
    { value: "default", label: "Default" },
    { value: "xtract", label: "Xtract" },
  ],
  project: [
    { value: "grid", label: "Grid" },
    { value: "carousel", label: "Carousel" },
    { value: "horizontal", label: "Horizontal Cards" },
  ],
  comparison: [{ value: "default", label: "Default" }],
  team: [{ value: "default", label: "Default" }],
  trustBar: [
    { value: "default", label: "Default (Signals)" },
    { value: "logos", label: "Logos (Scrolling Carousel)" },
  ],
};

interface SectionEditorProps {
  section: any;
  savedSection?: any;
  index: number;
  sectionCount: number;
  pageName: string;
  businessId: string;
  majorTheme?: string;
  onUpdate: (updatedSection: any) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function createFieldUpdater(section: any, onUpdate: (s: any) => void) {
  return {
    set: (field: string, value: any) => onUpdate({ ...section, [field]: value }),
    setHeader: (field: string, value: any) =>
      onUpdate({ ...section, header: { ...section.header, [field]: value } }),
    setNested: (parent: string, field: string, value: any) =>
      onUpdate({ ...section, [parent]: { ...section[parent], [field]: value } }),
  };
}

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

function RevertButton({ onClick }: { onClick: () => void }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      onClick={onClick}
      title="Revert to saved"
      className="text-amber-600 hover:text-destructive flex-shrink-0"
    >
      <Undo2 className="h-3 w-3" />
    </Button>
  );
}

function TextField({ label, value, savedValue, onChange, placeholder, sectionIndex, fieldPath }: {
  label: string; value: string; savedValue?: string; onChange: (v: string) => void; placeholder?: string;
  sectionIndex?: number; fieldPath?: string;
}) {
  const changed = savedValue !== undefined && value !== savedValue;
  const hover = sectionIndex != null && fieldPath ? fieldHoverProps(sectionIndex, fieldPath) : {};
  return (
    <div className="flex gap-4 items-center" {...hover}>
      <label className="w-24 flex-shrink-0 text-sm text-muted-foreground">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 ${changed ? "border-amber-600/60 bg-amber-600/5" : "border-border"}`}
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
      <label className="w-24 flex-shrink-0 text-sm pt-2 text-muted-foreground">{label}</label>
      <ImageUploadField value={value} onChange={onChange} businessId={businessId} placeholder={placeholder} />
      {changed && <div className="pt-2"><RevertButton onClick={() => onChange(savedValue)} /></div>}
    </div>
  );
}

function HeaderFields({ section, savedSection, updater, si }: { section: any; savedSection?: any; updater: ReturnType<typeof createFieldUpdater>; si: number }) {
  return (
    <>
      <TextField label="Badge" value={section.header?.badge || ""} savedValue={savedSection?.header?.badge || ""} onChange={(v) => updater.setHeader("badge", v)} sectionIndex={si} fieldPath="header.badge" />
      <TextField label="Title" value={section.header?.title || ""} savedValue={savedSection?.header?.title || ""} onChange={(v) => updater.setHeader("title", v)} sectionIndex={si} fieldPath="header.title" />
      <TextField label="Subtitle" value={section.header?.subtitle || ""} savedValue={savedSection?.header?.subtitle || ""} onChange={(v) => updater.setHeader("subtitle", v)} sectionIndex={si} fieldPath="header.subtitle" />
    </>
  );
}

function CtaFields({ section, savedSection, onUpdate, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; si: number }) {
  return (
    <div className="mt-3 pt-3 border-t border-border space-y-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Call to Action</span>
      <TextField label="CTA Label" value={section.cta?.label || ""} savedValue={savedSection?.cta?.label || ""} onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, label: v } })} sectionIndex={si} fieldPath="cta" />
      <TextField label="CTA Target" value={section.cta?.target || ""} savedValue={savedSection?.cta?.target || ""} onChange={(v) => onUpdate({ ...section, cta: { ...section.cta, target: v } })} sectionIndex={si} fieldPath="cta" />
      <TextField label="CTA 2 Label" value={section.secondaryCta?.label || ""} savedValue={savedSection?.secondaryCta?.label || ""} onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, label: v } })} sectionIndex={si} fieldPath="secondaryCta" />
      <TextField label="CTA 2 Target" value={section.secondaryCta?.target || ""} savedValue={savedSection?.secondaryCta?.target || ""} onChange={(v) => onUpdate({ ...section, secondaryCta: { ...section.secondaryCta, target: v } })} sectionIndex={si} fieldPath="secondaryCta" />
    </div>
  );
}

function ItemsEditor({ section, onUpdate, businessId, fields, si, fieldPrefix = "items" }: {
  section: any; onUpdate: (s: any) => void; businessId: string;
  fields: { key: string; label: string; type: "text" | "image" }[];
  si: number; fieldPrefix?: string;
}) {
  const items = section.items || [];

  const updateItem = (idx: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[idx] = { ...newItems[idx], [field]: value };
    onUpdate({ ...section, items: newItems });
  };

  const addItem = () => onUpdate({ ...section, items: [...items, { title: "New Item" }] });
  const removeItem = (idx: number) => {
    const newItems = [...items];
    newItems.splice(idx, 1);
    onUpdate({ ...section, items: newItems });
  };

  const moveItem = (idx: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= newItems.length) return;
    [newItems[idx], newItems[newIdx]] = [newItems[newIdx], newItems[idx]];
    onUpdate({ ...section, items: newItems });
  };

  return (
    <div className="mt-3 pt-3 border-t border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Items ({items.length})</span>
        <Button size="sm" variant="outline" onClick={addItem}>
          <Plus className="h-3 w-3 mr-1" />
          Add Item
        </Button>
      </div>
      {items.map((item: any, idx: number) => (
        <div key={idx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2" {...fieldHoverProps(si, `${fieldPrefix}.${idx}`)}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Item {idx + 1}</span>
            <div className="flex items-center gap-0.5">
              <Button size="icon-xs" variant="ghost" disabled={idx === 0} onClick={() => moveItem(idx, 'up')} title="Move up">
                <ChevronUp className="h-3 w-3" />
              </Button>
              <Button size="icon-xs" variant="ghost" disabled={idx === items.length - 1} onClick={() => moveItem(idx, 'down')} title="Move down">
                <ChevronDown className="h-3 w-3" />
              </Button>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeItem(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
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
      {items.length === 0 && <p className="text-xs italic text-muted-foreground">No items yet</p>}
    </div>
  );
}

function HeroFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
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
  const updater = createFieldUpdater(section, onUpdate);
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
  const updater = createFieldUpdater(section, onUpdate);
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
  const updater = createFieldUpdater(section, onUpdate);
  const variant = section.variant || "story";

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ImageField label="Image" value={section.image || ""} savedValue={savedSection?.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} sectionIndex={si} fieldPath="image" />

      {variant === "story" && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Story</span>
          <TextField label="Title" value={section.story?.title || ""} savedValue={savedSection?.story?.title || ""} onChange={(v) => updater.setNested("story", "title", v)} sectionIndex={si} fieldPath="story.title" />
          <TextField label="Content" value={section.story?.content || ""} savedValue={savedSection?.story?.content || ""} onChange={(v) => updater.setNested("story", "content", v)} sectionIndex={si} fieldPath="story.content" />
          <span className="text-xs font-semibold uppercase tracking-wide block pt-2 text-muted-foreground">Commitment</span>
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

      <ItemsEditor section={{ ...section, items: section.stats }} onUpdate={(s) => onUpdate({ ...section, stats: s.items })} businessId={businessId} si={si} fieldPrefix="stats" fields={[
        { key: "value", label: "Value", type: "text" },
        { key: "label", label: "Label", type: "text" },
      ]} />
    </>
  );
}

function ContactFields({ section, savedSection, onUpdate, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />

      <div className="mt-3 pt-3 border-t border-border space-y-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Form</span>
        <TextField label="Name Label" value={section.form?.nameLabel || ""} savedValue={savedSection?.form?.nameLabel || ""} onChange={(v) => updater.setNested("form", "nameLabel", v)} sectionIndex={si} fieldPath="form.nameLabel" />
        <TextField label="Email Label" value={section.form?.emailLabel || ""} savedValue={savedSection?.form?.emailLabel || ""} onChange={(v) => updater.setNested("form", "emailLabel", v)} sectionIndex={si} fieldPath="form.emailLabel" />
        <TextField label="Msg Label" value={section.form?.messageLabel || ""} savedValue={savedSection?.form?.messageLabel || ""} onChange={(v) => updater.setNested("form", "messageLabel", v)} sectionIndex={si} fieldPath="form.messageLabel" />
        <TextField label="Submit Btn" value={section.form?.submitButton || ""} savedValue={savedSection?.form?.submitButton || ""} onChange={(v) => updater.setNested("form", "submitButton", v)} sectionIndex={si} fieldPath="form.submitButton" />
      </div>

      {section.variant === "split" && (
        <div className="mt-3 pt-3 border-t border-border space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Contact Info</span>
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
  const updater = createFieldUpdater(section, onUpdate);
  const products = section.products || [];

  const updateProduct = (idx: number, field: string, value: any) => {
    const newProducts = [...products];
    newProducts[idx] = { ...newProducts[idx], [field]: value };
    onUpdate({ ...section, products: newProducts });
  };

  const addProduct = () => onUpdate({ ...section, products: [...products, { name: "New Product", price: 0, description: "" }] });

  const removeProduct = (idx: number) => {
    const newProducts = [...products];
    newProducts.splice(idx, 1);
    onUpdate({ ...section, products: newProducts });
  };

  const moveProduct = (idx: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= newProducts.length) return;
    [newProducts[idx], newProducts[newIdx]] = [newProducts[newIdx], newProducts[idx]];
    onUpdate({ ...section, products: newProducts });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />

      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Products ({products.length})</span>
          <Button size="sm" variant="outline" onClick={addProduct}>
            <Plus className="h-3 w-3 mr-1" />
            Add Product
          </Button>
        </div>
        {products.map((product: any, pIdx: number) => (
          <div key={pIdx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2" {...fieldHoverProps(si, `products.${pIdx}`)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Product {pIdx + 1}</span>
              <div className="flex items-center gap-0.5">
                <Button size="icon-xs" variant="ghost" disabled={pIdx === 0} onClick={() => moveProduct(pIdx, 'up')} title="Move up">
                  <ChevronUp className="h-3 w-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" disabled={pIdx === products.length - 1} onClick={() => moveProduct(pIdx, 'down')} title="Move down">
                  <ChevronDown className="h-3 w-3" />
                </Button>
                <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeProduct(pIdx)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <TextField label="Name" value={product.name || ""} onChange={(v) => updateProduct(pIdx, "name", v)} sectionIndex={si} fieldPath={`products.${pIdx}.name`} />
            <div className="flex gap-4 items-center" {...fieldHoverProps(si, `products.${pIdx}.price`)}>
              <label className="w-24 flex-shrink-0 text-sm text-muted-foreground">Price</label>
              <input
                type="number"
                value={product.price || ""}
                onChange={(e) => updateProduct(pIdx, "price", parseFloat(e.target.value) || 0)}
                className="flex-1 px-3 py-2 border border-border bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>
            <TextField label="Description" value={product.description || ""} onChange={(v) => updateProduct(pIdx, "description", v)} sectionIndex={si} fieldPath={`products.${pIdx}.description`} />
            <ImageField label="Image" value={product.image || ""} onChange={(v) => updateProduct(pIdx, "image", v)} businessId={businessId} sectionIndex={si} fieldPath={`products.${pIdx}.image`} />
          </div>
        ))}
        {products.length === 0 && <p className="text-xs italic text-muted-foreground">No products yet</p>}
      </div>
    </>
  );
}

function PricingFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  const tiers = section.pricingTiers || [];

  const updateTier = (idx: number, field: string, value: any) => {
    const newTiers = [...tiers];
    newTiers[idx] = { ...newTiers[idx], [field]: value };
    onUpdate({ ...section, pricingTiers: newTiers });
  };

  const addTier = () => onUpdate({ ...section, pricingTiers: [...tiers, { name: "New Tier", price: "$0", features: [] }] });

  const removeTier = (idx: number) => {
    const newTiers = [...tiers];
    newTiers.splice(idx, 1);
    onUpdate({ ...section, pricingTiers: newTiers });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pricing Tiers ({tiers.length})</span>
          <Button size="sm" variant="outline" onClick={addTier}>
            <Plus className="h-3 w-3 mr-1" />
            Add Tier
          </Button>
        </div>
        {tiers.map((tier: any, tIdx: number) => (
          <div key={tIdx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2" {...fieldHoverProps(si, `pricingTiers.${tIdx}`)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Tier {tIdx + 1}</span>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeTier(tIdx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TextField label="Name" value={tier.name || ""} onChange={(v) => updateTier(tIdx, "name", v)} sectionIndex={si} fieldPath={`pricingTiers.${tIdx}.name`} />
            <TextField label="Price" value={tier.price || ""} onChange={(v) => updateTier(tIdx, "price", v)} sectionIndex={si} fieldPath={`pricingTiers.${tIdx}.price`} />
            <TextField label="Period" value={tier.period || ""} onChange={(v) => updateTier(tIdx, "period", v)} sectionIndex={si} fieldPath={`pricingTiers.${tIdx}.period`} />
            <TextField label="Description" value={tier.description || ""} onChange={(v) => updateTier(tIdx, "description", v)} sectionIndex={si} fieldPath={`pricingTiers.${tIdx}.description`} />
            <TextField label="Badge" value={tier.badge || ""} onChange={(v) => updateTier(tIdx, "badge", v)} sectionIndex={si} fieldPath={`pricingTiers.${tIdx}.badge`} />
            <div className="flex gap-4 items-center">
              <label className="w-24 flex-shrink-0 text-sm text-muted-foreground">Highlighted</label>
              <input type="checkbox" checked={tier.highlighted || false} onChange={(e) => updateTier(tIdx, "highlighted", e.target.checked)} />
            </div>
          </div>
        ))}
        {tiers.length === 0 && <p className="text-xs italic text-muted-foreground">No pricing tiers yet</p>}
      </div>
    </>
  );
}

function ProjectFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  const projects = section.projects || [];

  const updateProject = (idx: number, field: string, value: any) => {
    const newProjects = [...projects];
    newProjects[idx] = { ...newProjects[idx], [field]: value };
    onUpdate({ ...section, projects: newProjects });
  };

  const addProject = () => onUpdate({ ...section, projects: [...projects, { title: "New Project", description: "" }] });

  const removeProject = (idx: number) => {
    const newProjects = [...projects];
    newProjects.splice(idx, 1);
    onUpdate({ ...section, projects: newProjects });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Projects ({projects.length})</span>
          <Button size="sm" variant="outline" onClick={addProject}>
            <Plus className="h-3 w-3 mr-1" />
            Add Project
          </Button>
        </div>
        {projects.map((project: any, pIdx: number) => (
          <div key={pIdx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2" {...fieldHoverProps(si, `projects.${pIdx}`)}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Project {pIdx + 1}</span>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeProject(pIdx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TextField label="Title" value={project.title || ""} onChange={(v) => updateProject(pIdx, "title", v)} sectionIndex={si} fieldPath={`projects.${pIdx}.title`} />
            <TextField label="Description" value={project.description || ""} onChange={(v) => updateProject(pIdx, "description", v)} sectionIndex={si} fieldPath={`projects.${pIdx}.description`} />
            <ImageField label="Image" value={project.image || ""} onChange={(v) => updateProject(pIdx, "image", v)} businessId={businessId} sectionIndex={si} fieldPath={`projects.${pIdx}.image`} />
            <TextField label="Date" value={project.date || ""} onChange={(v) => updateProject(pIdx, "date", v)} sectionIndex={si} fieldPath={`projects.${pIdx}.date`} />
          </div>
        ))}
        {projects.length === 0 && <p className="text-xs italic text-muted-foreground">No projects yet</p>}
      </div>
    </>
  );
}

function ComparisonFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  const rows = section.rows || [];

  const updateRow = (idx: number, field: string, value: any) => {
    const newRows = [...rows];
    newRows[idx] = { ...newRows[idx], [field]: value };
    onUpdate({ ...section, rows: newRows });
  };
  const addRow = () => onUpdate({ ...section, rows: [...rows, { left: "", right: "" }] });
  const removeRow = (idx: number) => {
    const newRows = [...rows];
    newRows.splice(idx, 1);
    onUpdate({ ...section, rows: newRows });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <TextField label="Left Title" value={section.leftTitle || ""} savedValue={savedSection?.leftTitle || ""} onChange={(v) => updater.set("leftTitle", v)} sectionIndex={si} fieldPath="leftTitle" />
      <TextField label="Right Title" value={section.rightTitle || ""} savedValue={savedSection?.rightTitle || ""} onChange={(v) => updater.set("rightTitle", v)} sectionIndex={si} fieldPath="rightTitle" />
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Rows ({rows.length})</span>
          <Button size="sm" variant="outline" onClick={addRow}>
            <Plus className="h-3 w-3 mr-1" /> Add Row
          </Button>
        </div>
        {rows.map((row: any, idx: number) => (
          <div key={idx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Row {idx + 1}</span>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeRow(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TextField label="Left" value={row.left || ""} onChange={(v) => updateRow(idx, "left", v)} sectionIndex={si} fieldPath={`rows.${idx}.left`} />
            <TextField label="Right" value={row.right || ""} onChange={(v) => updateRow(idx, "right", v)} sectionIndex={si} fieldPath={`rows.${idx}.right`} />
          </div>
        ))}
        {rows.length === 0 && <p className="text-xs italic text-muted-foreground">No rows yet</p>}
      </div>
    </>
  );
}

function TeamFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  const members = section.members || [];

  const updateMember = (idx: number, field: string, value: any) => {
    const newMembers = [...members];
    newMembers[idx] = { ...newMembers[idx], [field]: value };
    onUpdate({ ...section, members: newMembers });
  };
  const addMember = () => onUpdate({ ...section, members: [...members, { name: "", role: "" }] });
  const removeMember = (idx: number) => {
    const newMembers = [...members];
    newMembers.splice(idx, 1);
    onUpdate({ ...section, members: newMembers });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Members ({members.length})</span>
          <Button size="sm" variant="outline" onClick={addMember}>
            <Plus className="h-3 w-3 mr-1" /> Add Member
          </Button>
        </div>
        {members.map((member: any, idx: number) => (
          <div key={idx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Member {idx + 1}</span>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeMember(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TextField label="Name" value={member.name || ""} onChange={(v) => updateMember(idx, "name", v)} sectionIndex={si} fieldPath={`members.${idx}.name`} />
            <TextField label="Role" value={member.role || ""} onChange={(v) => updateMember(idx, "role", v)} sectionIndex={si} fieldPath={`members.${idx}.role`} />
            <ImageField label="Photo" value={member.image || ""} onChange={(v) => updateMember(idx, "image", v)} businessId={businessId} sectionIndex={si} fieldPath={`members.${idx}.image`} />
            <TextField label="LinkedIn" value={member.linkedin || ""} onChange={(v) => updateMember(idx, "linkedin", v)} sectionIndex={si} fieldPath={`members.${idx}.linkedin`} />
          </div>
        ))}
        {members.length === 0 && <p className="text-xs italic text-muted-foreground">No members yet</p>}
      </div>
    </>
  );
}

function TrustBarFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  const logos = section.clientLogos || [];

  const updateLogo = (idx: number, field: string, value: any) => {
    const newLogos = [...logos];
    newLogos[idx] = { ...newLogos[idx], [field]: value };
    onUpdate({ ...section, clientLogos: newLogos });
  };
  const addLogo = () => onUpdate({ ...section, clientLogos: [...logos, { name: "", image: "" }] });
  const removeLogo = (idx: number) => {
    const newLogos = [...logos];
    newLogos.splice(idx, 1);
    onUpdate({ ...section, clientLogos: newLogos });
  };

  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <div className="mt-3 pt-3 border-t border-border">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Client Logos ({logos.length})</span>
          <Button size="sm" variant="outline" onClick={addLogo}>
            <Plus className="h-3 w-3 mr-1" /> Add Logo
          </Button>
        </div>
        {logos.map((logo: any, idx: number) => (
          <div key={idx} className="mb-3 p-3 bg-muted/30 border border-border rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Logo {idx + 1}</span>
              <Button size="icon-xs" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => removeLogo(idx)}>
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
            <TextField label="Name" value={logo.name || ""} onChange={(v) => updateLogo(idx, "name", v)} sectionIndex={si} fieldPath={`clientLogos.${idx}.name`} />
            <ImageField label="Logo Image" value={logo.image || ""} onChange={(v) => updateLogo(idx, "image", v)} businessId={businessId} sectionIndex={si} fieldPath={`clientLogos.${idx}.image`} />
          </div>
        ))}
        {logos.length === 0 && <p className="text-xs italic text-muted-foreground">No logos yet</p>}
      </div>
    </>
  );
}

function DefaultFields({ section, savedSection, onUpdate, businessId, si }: { section: any; savedSection?: any; onUpdate: (s: any) => void; businessId: string; si: number }) {
  const updater = createFieldUpdater(section, onUpdate);
  return (
    <>
      <HeaderFields section={section} savedSection={savedSection} updater={updater} si={si} />
      <ImageField label="Image" value={section.image || ""} savedValue={savedSection?.image || ""} onChange={(v) => updater.set("image", v)} businessId={businessId} sectionIndex={si} fieldPath="image" />
      <ImageField label="Background" value={section.backgroundImage || ""} savedValue={savedSection?.backgroundImage || ""} onChange={(v) => updater.set("backgroundImage", v)} businessId={businessId} sectionIndex={si} fieldPath="backgroundImage" />
    </>
  );
}

export default function SectionEditor({ section, savedSection, index, sectionCount, pageName, businessId, majorTheme, onUpdate, onRemove, onMoveUp, onMoveDown }: SectionEditorProps) {
  const variants = VARIANT_OPTIONS[section.type] || [];

  const handleTypeChange = (newType: string) => {
    const defaultVariant = VARIANT_OPTIONS[newType]?.[0]?.value || "default";
    onUpdate({ ...section, type: newType, variant: defaultVariant });
  };

  const typeChanged = savedSection && section.type !== savedSection.type;
  const variantChanged = savedSection && section.variant !== savedSection.variant;

  // Major theme override detection
  const majorThemeDefaults: Record<string, Record<string, string>> = {
    specialist: { hero: "split", services: "darkCards", categories: "carousel", about: "story", contact: "split", testimonials: "default", faq: "default", features: "default", ctaBanner: "default", process: "default", pricing: "default", project: "grid", blog: "default", shop: "grid", comparison: "default", team: "default", trustBar: "default" },
    "portfolio-tech": { hero: "gradient", services: "alternating", categories: "featured", about: "story", contact: "split", testimonials: "gradient", faq: "bordered", features: "gradient", ctaBanner: "card", process: "grid", pricing: "xtract", project: "horizontal", blog: "default", shop: "grid", comparison: "default", team: "default", trustBar: "logos" },
  };
  const themeDefaultVariant = majorTheme ? majorThemeDefaults[majorTheme]?.[section.type] : undefined;
  const isOverridden = majorTheme && section.variant && themeDefaultVariant && section.variant !== themeDefaultVariant;

  const renderTypeFields = () => {
    const props = { section, savedSection, onUpdate, businessId, si: index };
    switch (section.type) {
      case "hero": return <HeroFields {...props} />;
      case "services": return <ServicesFields {...props} />;
      case "categories": return <CategoriesFields {...props} />;
      case "about": return <AboutFields {...props} />;
      case "contact": return <ContactFields {...props} />;
      case "shop": return <ShopFields {...props} />;
      case "pricing": return <PricingFields {...props} />;
      case "project": return <ProjectFields {...props} />;
      case "comparison": return <ComparisonFields {...props} />;
      case "team": return <TeamFields {...props} />;
      case "trustBar": return <TrustBarFields {...props} />;
      default: return <DefaultFields {...props} />;
    }
  };

  return (
    <div
      className="mb-4 p-4 border border-border rounded-lg bg-card"
      onMouseEnter={() => postHighlight('highlight-section', index)}
      onMouseLeave={() => postHighlight('clear-highlight')}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-sm">Section {index + 1}: {section.type}</span>
        <div className="flex items-center gap-0.5">
          <Button size="icon-xs" variant="ghost" disabled={index === 0} onClick={onMoveUp} title="Move up">
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button size="icon-xs" variant="ghost" disabled={index === sectionCount - 1} onClick={onMoveDown} title="Move down">
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={onRemove}>
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Remove
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex gap-4 items-center">
          <label className="w-24 flex-shrink-0 text-sm text-muted-foreground">Type</label>
          <select
            value={section.type || "hero"}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={`flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 ${typeChanged ? "border-amber-600/60 bg-amber-600/5" : "border-border"}`}
          >
            <option value="hero">Hero</option>
            <option value="services">Services</option>
            <option value="categories">Categories</option>
            <option value="about">About</option>
            <option value="contact">Contact</option>
            <option value="gallery">Gallery</option>
            <option value="testimonials">Testimonials</option>
            <option value="shop">Shop</option>
            <option value="pricing">Pricing</option>
            <option value="project">Project</option>
            <option value="faq">FAQ</option>
            <option value="features">Features</option>
            <option value="process">Process</option>
            <option value="ctaBanner">CTA Banner</option>
            <option value="blog">Blog</option>
            <option value="comparison">Comparison</option>
            <option value="team">Team</option>
          </select>
          {typeChanged && <RevertButton onClick={() => onUpdate({ ...section, type: savedSection.type, variant: savedSection.variant })} />}
        </div>

        <div className="flex gap-4 items-center">
          <label className="w-24 flex-shrink-0 text-sm text-muted-foreground">Variant</label>
          <select
            value={section.variant || variants[0]?.value || "default"}
            onChange={(e) => onUpdate({ ...section, variant: e.target.value })}
            className={`flex-1 px-3 py-2 border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 ${variantChanged ? "border-amber-600/60 bg-amber-600/5" : "border-border"}`}
          >
            {variants.map((v) => (
              <option key={v.value} value={v.value}>{v.label}</option>
            ))}
          </select>
          {variantChanged && <RevertButton onClick={() => onUpdate({ ...section, variant: savedSection.variant })} />}
          {isOverridden && (
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-600/10 text-amber-600 border border-amber-600/20 rounded">
                Override
              </span>
              <button
                onClick={() => onUpdate({ ...section, variant: themeDefaultVariant })}
                className="px-2 py-1 text-xs bg-amber-600/10 text-amber-600 border border-amber-600/30 rounded hover:bg-amber-600/20 transition-colors whitespace-nowrap flex items-center gap-1"
                title={`Reset to ${majorTheme} theme default (${themeDefaultVariant})`}
              >
                <Undo2 className="h-3 w-3" />
                Revert to theme
              </button>
            </div>
          )}
        </div>

        {renderTypeFields()}
      </div>
    </div>
  );
}
