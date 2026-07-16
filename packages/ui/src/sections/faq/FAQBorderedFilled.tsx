"use client";

import * as React from "react";
import { FAQBordered } from "./FAQBordered";
import type { FAQAccordionProps } from "./types";

/**
 * bordered-filled FAQ variant.
 *
 * Thin wrapper around {@link FAQBordered} that forces the light "filled" card
 * treatment (white card surface + navy text) so the accordion reads correctly
 * even inside a dark section. Behaves identically to FAQBordered otherwise.
 */
export function FAQBorderedFilled(props: FAQAccordionProps) {
  return <FAQBordered {...props} filled />;
}
