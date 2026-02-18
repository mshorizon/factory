"use client";

import { Phone } from "lucide-react";
import { Button } from "./Button";
import { cn } from "../lib/utils";

export interface StickyMobileCTAProps {
  phone: string;
  label?: string;
  className?: string;
}

export function StickyMobileCTA({ phone, label = "Call Now", className }: StickyMobileCTAProps) {
  const telHref = `tel:${phone.replace(/\s/g, "")}`;

  return (
    <div className={cn("fixed bottom-4 left-1/2 -translate-x-1/2 z-50 md:hidden", className)}>
      <Button asChild size="lg" className="shadow-lg px-10 whitespace-nowrap">
        <a href={telHref}>
          <Phone className="h-5 w-5" />
          {label}
        </a>
      </Button>
    </div>
  );
}
