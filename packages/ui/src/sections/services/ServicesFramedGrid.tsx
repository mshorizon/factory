"use client";

import { cn } from "../../lib/utils";
import { Card } from "../../atoms/Card";
import { StaggerContainer, StaggerItem } from "../../animations/StaggerContainer";
import {
  FileText, Users, CheckCircle, Home, Scroll, Stamp, Scale,
  Briefcase, Heart, Banknote, Gavel, Building, Globe, Phone,
  Shield, Star, Clock, Award,
  Droplets, BookOpen, Flower,
} from "lucide-react";
import type { ServicesProps } from "./types";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "file-text": FileText,
  users: Users,
  "check-circle": CheckCircle,
  home: Home,
  scroll: Scroll,
  stamp: Stamp,
  scale: Scale,
  briefcase: Briefcase,
  heart: Heart,
  banknote: Banknote,
  gavel: Gavel,
  building: Building,
  globe: Globe,
  phone: Phone,
  shield: Shield,
  star: Star,
  clock: Clock,
  award: Award,
  "droplets": Droplets,
  "book-open": BookOpen,
  "flower": Flower,
};

export function ServicesFramedGrid({
  items,
  requirementsLabel = "Wymagane:",
  className,
}: ServicesProps) {
  return (
    <StaggerContainer
      className={cn("grid sm:grid-cols-2 lg:grid-cols-4 gap-spacing-lg", className)}
      staggerDelay={0.1}
    >
      {items.map((item, index) => {
        const directions = ["left", "up", "right"] as const;
        const direction = directions[index % 3];
        const IconComponent = item.icon ? iconMap[item.icon] : undefined;
        return (
          <StaggerItem key={index} direction={direction} distance={30}>
            <a href={`/services/${item.slug || item.id}`} className="block h-full cursor-pointer" data-field={`items.${index}`}>
              <Card className="group h-full p-spacing-lg flex flex-col items-center text-center border border-border !rounded-radius hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer">
                {item.icon && iconMap[item.icon] && IconComponent && (
                  <span className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-spacing-md self-center">
                    <IconComponent className="h-6 w-6 text-primary" />
                  </span>
                )}
                <h3 className="text-2xl font-heading text-foreground mb-spacing-sm" data-field={`items.${index}.title`}>
                  {item.title}
                </h3>
                <p className="text-base font-body text-muted mb-spacing-md flex-1" data-field={`items.${index}.description`}>
                  {item.description}
                </p>
                {item.requirements && (
                  <p className="text-sm text-muted leading-relaxed mt-spacing-sm">
                    <span className="font-semibold text-foreground">{requirementsLabel} </span>
                    {item.requirements}
                  </p>
                )}
              </Card>
            </a>
          </StaggerItem>
        );
      })}
    </StaggerContainer>
  );
}
