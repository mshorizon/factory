"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import type { ServicesProps, CategoryGroup } from "./types";

export function ServicesList({
  items,
  ctaLabel,
  ctaHref = "/contact",
  className,
  categories,
  categoryGroups,
  defaultCategory,
  columns = 1,
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

  const layoutClass = columns >= 3
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

  return (
    <div className={className}>
      {hasTabs && (
        <div
          className="flex flex-wrap lg:flex-nowrap justify-center gap-x-spacing-lg gap-y-spacing-md border-b border-border mb-spacing-2xl"
          role="tablist"
        >
          {effectiveTabs.map((tab) =>
            renderTabButton(tab.id, tab.label, tab.id === activeTab, () => handleTabClick(tab.id))
          )}
        </div>
      )}

      {activeGroup?.showSubTabs && (
        <div
          className="flex flex-wrap justify-center gap-x-spacing-md gap-y-spacing-sm mb-spacing-xl"
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
                  "px-spacing-md py-spacing-xs text-sm rounded-full border transition-colors",
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
      )}

      <StaggerContainer key={activeTab + activeSubTab} className={layoutClass} staggerDelay={0.1}>
        {visiblePairs.map(({ item, index }, renderIndex) => {
          const direction = renderIndex % 2 === 0 ? "left" : "right";
          return (
            <StaggerItem key={index} direction={direction} distance={20}>
              <a href={`/services/${item.slug || item.id}`} className="services-list-item group flex flex-col md:flex-row md:items-center justify-between gap-spacing-md p-spacing-lg border border-border rounded-radius-secondary hover:shadow-lg hover:border-primary/20 transition-all block cursor-pointer" data-field={`items.${index}`}>
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
                {ctaLabel && (
                  <div className="shrink-0 flex items-center gap-spacing-xs text-muted group-hover:text-primary transition-colors">
                    <span>{ctaLabel}</span>
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                )}
              </a>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
