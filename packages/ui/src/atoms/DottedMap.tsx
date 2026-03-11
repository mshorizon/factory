"use client";

import { useMemo } from "react";
import { generateDottedMap, type DottedMapOptions } from "../utils/dotted-map";

export interface DottedMapProps extends DottedMapOptions {
  className?: string;
}

export function DottedMap({ className, ...options }: DottedMapProps) {
  const { svg } = useMemo(() => generateDottedMap(options), [options]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ color: "var(--foreground)" }}
    />
  );
}
