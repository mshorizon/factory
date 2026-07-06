"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Plus, Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { SafeImage } from "../../atoms/SafeImage.js";
import { ImageDescription } from "../../atoms/ImageDescription";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { useCart } from "../../store/useCart";
import type { ServicesProps, CategoryGroup, ServiceItem } from "./types";
import type { Product } from "@mshorizon/schema";

function serviceItemToProduct(item: ServiceItem): Product | null {
  if (!item.orderable || typeof item.priceValue !== "number" || !item.id) return null;
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    price: item.priceValue,
    image: item.image,
    category: item.category,
  };
}

export function ServicesList({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
  categories,
  categoryGroups,
  defaultCategory,
  columns = 1,
  categoryImages,
}: ServicesProps) {
  const hasTabs = !!categories && categories.length > 0;

  // Map category ID → group
  const groupByCatId = new Map<string, CategoryGroup>();
  for (const group of categoryGroups ?? []) {
    for (const catId of group.categories) {
      groupByCatId.set(catId, group);
    }
  }

  // Build ordered top-level effective tabs (groups replace constituent categories in-place)
  const effectiveTabs: Array<{ id: string; label: string; isGroup: boolean }> = [];
  const addedGroupIds = new Set<string>();
  for (const cat of categories ?? []) {
    const group = groupByCatId.get(cat.id);
    if (group) {
      if (!addedGroupIds.has(group.id)) {
        effectiveTabs.push({ id: group.id, label: group.label, isGroup: true });
        addedGroupIds.add(group.id);
      }
    } else {
      effectiveTabs.push({ id: cat.id, label: cat.label, isGroup: false });
    }
  }

  const categoryById = new Map((categories ?? []).map((c) => [c.id, c]));

  const initialTab = hasTabs
    ? (effectiveTabs.some((t) => t.id === defaultCategory) ? defaultCategory! : effectiveTabs[0]?.id ?? "")
    : "";

  const getInitialSubTab = (tabId: string) => {
    const group = (categoryGroups ?? []).find((g) => g.id === tabId);
    return group?.showSubTabs ? group.categories[0] : "";
  };

  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSubTab, setActiveSubTab] = useState(() => getInitialSubTab(initialTab));
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const addItemToCart = useCart((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent, item: ServiceItem) => {
    e.preventDefault();
    e.stopPropagation();
    const product = serviceItemToProduct(item);
    if (!product) return;
    // Cart shows the human category label, not the tab id
    const categoryLabel = item.category
      ? categoryById.get(item.category)?.label.replace(/\s*\(.*\)\s*$/, "") ?? item.category
      : undefined;
    addItemToCart({ ...product, category: categoryLabel });
    setJustAddedId(product.id);
    window.setTimeout(() => setJustAddedId((cur) => (cur === product.id ? null : cur)), 1200);
  };

  const activeGroup = (categoryGroups ?? []).find((g) => g.id === activeTab);

  const visiblePairs = items
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => {
      if (!hasTabs) return true;
      if (activeGroup) {
        return activeGroup.showSubTabs
          ? item.category === activeSubTab
          : activeGroup.categories.includes(item.category ?? "");
      }
      return item.category === activeTab;
    });

  // Side-image mode: a two-column split (tabs + single-column items on the left,
  // a bordered image with a caption overlay on the right that cross-reveals on tab
  // change). Opt-in via `categoryImages`; otherwise the legacy layout is unchanged.
  const imageByTab = new Map((categoryImages ?? []).map((ci) => [ci.id, ci]));
  const hasSideImage = hasTabs && imageByTab.size > 0;
  const activeImage = imageByTab.get(activeTab) ?? categoryImages?.[0];

  const layoutClass = hasSideImage
    ? "space-y-0"
    : columns >= 3
      ? "grid grid-cols-1 md:grid-cols-3 gap-spacing-md"
      : columns === 2
        ? "grid grid-cols-1 md:grid-cols-2 gap-x-spacing-3xl gap-y-spacing-md"
        : "space-y-spacing-md";

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    setActiveSubTab(getInitialSubTab(tabId));
  };

  const renderTabButton = (id: string, label: string, active: boolean, onClick: () => void) => {
    const match = label.match(/^(.*?)\s*(\(.*\))\s*$/);
    const main = match ? match[1] : label;
    const paren = match ? match[2] : "";
    return (
      <button
        key={id}
        type="button"
        role="tab"
        aria-selected={active}
        onClick={onClick}
        className={cn(
          "services-tab relative pb-spacing-md text-lg transition-colors whitespace-nowrap",
          active
            ? "text-foreground font-semibold"
            : "text-muted font-medium hover:text-foreground"
        )}
        data-active={active ? "1" : undefined}
      >
        {main}
        {paren && (
          <span className={cn("ml-spacing-xs", active ? "text-primary" : undefined)}>
            {paren}
          </span>
        )}
        {active && (
          <motion.span
            layoutId="services-tab-indicator"
            className="absolute -bottom-px left-0 right-0 h-0.5 bg-primary"
            transition={{ type: "spring", stiffness: 500, damping: 35 }}
          />
        )}
      </button>
    );
  };

  const renderItem = (item: ServiceItem, index: number, direction: "left" | "right") => {
    const isOrderable = !!(item.orderable && typeof item.priceValue === "number" && item.id);
    const justAdded = isOrderable && justAddedId === item.id;
    const RowTag: any = isOrderable ? "div" : "a";
    const rowExtra = isOrderable ? {} : { href: `/services/${item.slug || item.id}` };
    const addButton = isOrderable && (
      <button
        type="button"
        onClick={(e) => handleAddToCart(e, item)}
        aria-label={`Dodaj ${item.title} do koszyka`}
        className={cn(
          "shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-radius border transition-colors pointer-events-auto cursor-pointer",
          justAdded
            ? "border-primary bg-primary text-on-primary"
            : "border-border text-foreground hover:border-primary hover:bg-primary hover:text-on-primary"
        )}
      >
        {justAdded ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
      </button>
    );

    if (hasSideImage) {
      // Menu-row style: no full card border, a hairline divider, and an animated
      // vertical accent bar that grows on the left edge on hover.
      return (
        <StaggerItem key={index} direction="up" distance={16} className="group/svc services-item-wrap">
          <RowTag
            {...rowExtra}
            className={cn(
              "services-list-item group relative flex items-start justify-between gap-spacing-md py-spacing-md pl-spacing-md border-b border-border/60 transition-colors group-hover/svc:bg-foreground/[0.03]",
              isOrderable ? "" : "cursor-pointer"
            )}
            data-field={`items.${index}`}
          >
            {/* Vertical accent bar: always in CTA (primary) color, grows in height
                from the center on hover and shrinks back on unhover. Absolutely
                positioned so it never shifts the row's text. */}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-full w-0.5 origin-center scale-y-0 bg-primary transition-transform duration-300 ease-out group-hover/svc:scale-y-100"
            />
            <div className="flex-1">
              <h3
                className="services-item-title text-lg font-semibold font-heading text-foreground group-hover/svc:text-primary transition-colors"
                data-field={`items.${index}.title`}
              >
                {item.title}
              </h3>
              <p className="services-item-desc mt-spacing-xs text-sm text-muted" data-field={`items.${index}.description`}>
                {item.description}
              </p>
            </div>
            {item.price && (
              <span
                className="services-item-price shrink-0 text-base font-bold text-primary whitespace-nowrap"
                data-field={`items.${index}.price`}
              >
                {item.price}
              </span>
            )}
            {addButton}
          </RowTag>
        </StaggerItem>
      );
    }

    return (
      <StaggerItem key={index} direction={direction} distance={20}>
        <RowTag
          {...rowExtra}
          className={cn(
            "services-list-item group flex flex-col md:flex-row md:items-center justify-between gap-spacing-md p-spacing-lg border border-border rounded-radius-secondary hover:shadow-lg hover:border-primary/20 transition-all block",
            isOrderable ? "" : "cursor-pointer"
          )}
          data-field={`items.${index}`}
        >
          <div className="flex-1">
            <div className="flex items-center gap-spacing-sm mb-spacing-xs">
              <h3 className="services-item-title text-xl font-semibold font-heading text-foreground group-hover:text-primary transition-colors" data-field={`items.${index}.title`}>
                {item.title}
              </h3>
              {item.price && (
                <span className="services-item-price px-3 py-1 text-sm font-bold text-primary bg-primary/10 rounded-full" data-field={`items.${index}.price`}>
                  {item.price}
                </span>
              )}
            </div>
            <p className="services-item-desc text-muted" data-field={`items.${index}.description`}>{item.description}</p>
          </div>
          {isOrderable ? (
            addButton
          ) : ctaLabel && (
            <div className="shrink-0 flex items-center gap-spacing-xs text-muted group-hover:text-primary transition-colors">
              <span>{ctaLabel}</span>
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          )}
        </RowTag>
      </StaggerItem>
    );
  };

  const tabsBlock = hasTabs && (
    <ScrollReveal direction="up" distance={20}>
      <div
        className={cn(
          "flex flex-wrap gap-x-spacing-lg gap-y-spacing-md border-b border-border mb-spacing-2xl",
          hasSideImage ? "justify-start" : "justify-center"
        )}
        role="tablist"
      >
        {effectiveTabs.map((tab) =>
          renderTabButton(tab.id, tab.label, tab.id === activeTab, () => handleTabClick(tab.id))
        )}
      </div>
    </ScrollReveal>
  );

  const subTabsBlock = activeGroup?.showSubTabs && (
    <ScrollReveal direction="up" distance={16} delay={0.05}>
      <div
        className={cn(
          "flex flex-wrap gap-x-spacing-md gap-y-spacing-sm mb-spacing-xl",
          hasSideImage ? "justify-start" : "justify-center"
        )}
        role="tablist"
      >
        {activeGroup.categories.map((catId) => {
        const cat = categoryById.get(catId);
        if (!cat) return null;
        const active = catId === activeSubTab;
        return (
          <button
            key={catId}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setActiveSubTab(catId)}
            className={cn(
              "px-spacing-md py-spacing-xs text-sm rounded-radius border transition-colors",
              active
                ? "border-primary bg-primary/10 text-primary font-semibold"
                : "border-border text-muted hover:text-foreground hover:border-foreground/30"
            )}
          >
            {cat.label}
          </button>
        );
        })}
      </div>
    </ScrollReveal>
  );

  const listBlock = (
    <StaggerContainer key={activeTab + activeSubTab} className={layoutClass} staggerDelay={hasSideImage ? 0.06 : 0.1}>
      {visiblePairs.map(({ item, index }, renderIndex) =>
        renderItem(item, index, renderIndex % 2 === 0 ? "left" : "right")
      )}
    </StaggerContainer>
  );

  if (hasSideImage) {
    return (
      <div className={cn("grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-spacing-2xl lg:gap-spacing-3xl items-start", className)}>
        {/* Left: tabs + single-column menu */}
        <div className="relative z-10 min-w-0">
          {tabsBlock}
          {subTabsBlock}
          {listBlock}
        </div>

        {/* Right: image with caption overlay that cross-reveals on tab change */}
        <ScrollReveal direction="up" distance={20} delay={0.1} className="hidden lg:block lg:sticky lg:top-28">
          <div className="relative w-full overflow-hidden leading-[0] aspect-[4/5]">
            <AnimatePresence initial={false}>
              {activeImage && (
                <motion.div
                  key={activeImage.id}
                  className="absolute inset-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                >
                  <SafeImage
                    src={activeImage.image}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    data-field="categoryImages.image"
                    loading="lazy"
                    decoding="async"
                  />
                  {activeImage.imageDescription &&
                    (activeImage.imageDescription.name || activeImage.imageDescription.description) && (
                      <ImageDescription
                        {...activeImage.imageDescription}
                        className="absolute bottom-0 left-0"
                      />
                    )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Inner border — a translucent line so its color blends with the image beneath */}
            <div className="pointer-events-none absolute inset-0 border border-white/20" />
          </div>
        </ScrollReveal>
      </div>
    );
  }

  return (
    <div className={className}>
      {tabsBlock}
      {subTabsBlock}
      {listBlock}
    </div>
  );
}
