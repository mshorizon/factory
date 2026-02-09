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
    <div className={cn("fixed bottom-4 left-4 right-4 z-50 md:hidden", className)}>
      <Button asChild size="lg" className="w-full shadow-lg">
        <a href={telHref}>
          <Phone className="h-5 w-5" />
          {label}
        </a>
      </Button>
    </div>
  );
}
