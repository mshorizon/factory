"use client";

import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import { ScrollReveal } from "../../animations/ScrollReveal";
import type { ContactSplitProps } from "./types";

export function ContactSplit({
  title,
  subtitle,
  form,
  info,
  labels,
  className,
}: ContactSplitProps) {
  return (
    <div className={cn("max-w-6xl mx-auto", className)}>
      {(title || subtitle) && (
        <ScrollReveal delay={0} direction="up">
          <div className="text-center mb-12">
            {title && (
              <h1 className="text-4xl font-bold text-foreground mb-2">{title}</h1>
            )}
            {subtitle && (
              <p className="text-muted">{subtitle}</p>
            )}
          </div>
        </ScrollReveal>
      )}

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Contact Info */}
        <ScrollReveal delay={0.1} direction="left" distance={30}>
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">{labels?.getInTouchTitle || "Get in Touch"}</h2>
              <p className="text-muted mb-8">
                {labels?.getInTouchSubtitle || "We'd love to hear from you. Send us a message and we'll respond as soon as possible."}
              </p>
            </div>

            {info && (
              <div className="space-y-6">
                {info.address && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-radius bg-primary/10 flex items-center justify-center shrink-0">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{labels?.addressLabel || "Address"}</h3>
                      <p className="text-muted">{info.address}</p>
                    </div>
                  </div>
                )}

                {info.phone && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-radius bg-primary/10 flex items-center justify-center shrink-0">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{labels?.phoneLabel || "Phone"}</h3>
                      <p className="text-muted">{info.phone}</p>
                    </div>
                  </div>
                )}

                {info.email && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-radius bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{labels?.emailLabel || "Email"}</h3>
                      <p className="text-muted">{info.email}</p>
                    </div>
                  </div>
                )}

                {info.hours && (
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-radius bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{labels?.hoursLabel || "Hours"}</h3>
                      <p className="text-muted">{info.hours}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollReveal>

        {/* Contact Form */}
        <ScrollReveal delay={0.1} direction="right" distance={30}>
          <form className="space-y-6 bg-background border border-border rounded-radius p-8 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">
                {form?.nameLabel || "Name"}
              </Label>
              <Input
                type="text"
                id="name"
                name="name"
                placeholder={form?.namePlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">
                {form?.emailLabel || "Email"}
              </Label>
              <Input
                type="email"
                id="email"
                name="email"
                placeholder={form?.emailPlaceholder}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message" className="text-foreground">
                {form?.messageLabel || "Message"}
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder={form?.messagePlaceholder}
                rows={5}
                required
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              {form?.submitButton || "Send Message"}
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </div>
  );
}
