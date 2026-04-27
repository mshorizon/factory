"use client";

import { TrendingUp } from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { TrustSignal } from "./types";

interface TrustBarStatsProps {
  label?: string;
  sublabel?: string;
  stats?: { value: string; label: string }[];
  className?: string;
}

export function TrustBarStats({ label, sublabel, stats = [], className }: TrustBarStatsProps) {
  return (
    <ScrollReveal className={cn("bg-foreground text-background", className)}>
      <div className="container mx-auto">
        <div className="grid md:grid-cols-4 gap-y-6 gap-x-8 items-center py-12">
          <div className="md:col-span-1 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 text-primary flex items-center justify-center shrink-0">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div className="text-[11px] uppercase tracking-wider text-background/60 font-bold leading-tight">
              {label}
              {sublabel && (
                <>
                  <br />
                  <span className="text-background text-base normal-case tracking-normal font-extrabold">
                    {sublabel}
                  </span>
                </>
              )}
            </div>
          </div>

          {stats.map((stat, i) => (
            <div key={i} className="md:col-span-1 border-l border-background/15 md:pl-6">
              <div className="text-3xl md:text-4xl font-extrabold mb-1">{stat.value}</div>
              <div className="text-xs text-background/70 leading-tight">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </ScrollReveal>
  );
}
