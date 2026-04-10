"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import { Badge } from "../../atoms/Badge";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { Turnstile } from "../../atoms/Turnstile";
import type { ContactSplitProps, SelectField } from "./types";

export function ContactSplit({
  title,
  subtitle,
  badge,
  form,
  info,
  labels,
  businessId,
  business,
  turnstileSiteKey,
  className,
}: ContactSplitProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (turnstileSiteKey && !turnstileToken) {
      return;
    }

    setStatus("loading");

    const data = new FormData(e.currentTarget);

    // Compose qualifying fields into the message
    let message = (data.get("message") as string) || "";
    const qualifiers: string[] = [];
    for (const field of form?.selectFields ?? []) {
      const val = data.get(field.name) as string;
      if (val && val !== "__placeholder__") {
        qualifiers.push(`${field.label || field.name}: ${val}`);
      }
    }
    if (qualifiers.length > 0) {
      message = qualifiers.join("\n") + "\n\n" + message;
    }

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message,
          businessId,
          turnstileToken,
        }),
      });

      if (res.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
        (window as any).umami?.track('contact-form-submit');
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  // Use business contact info if available, fallback to info prop
  const contactInfo = {
    address: business?.business?.contact?.address || info?.address,
    phone: business?.business?.contact?.phone || info?.phone,
    email: business?.business?.contact?.email || info?.email,
    hours: business?.business?.contact?.hours || info?.hours,
    location: business?.business?.contact?.location,
  };

  // Generate Google Maps URL from location coordinates
  const mapsUrl = contactInfo.location
    ? `https://www.google.com/maps?q=${contactInfo.location.latitude},${contactInfo.location.longitude}`
    : null;

  return (
    <div className={cn("max-w-5xl mx-auto", className)}>
      {/* Header (only rendered when badge/title/subtitle are passed directly) */}
      {(badge || title) && (
        <div className="text-center mb-spacing-3xl">
          {badge && (
            <div className="flex items-center gap-spacing-sm justify-center mb-spacing-lg">
              <span className="w-12 h-[2px]" style={{ backgroundColor: "var(--primary-dark)" }} />
              <Badge variant="accent" data-field="header.badge" style={{ color: "var(--primary-dark)" }}>
                {badge}
              </Badge>
            </div>
          )}
          {title && (
            <h1 className="text-4xl lg:text-5xl font-heading text-foreground leading-tight mb-spacing-md" data-field="header.title">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-muted text-lg leading-relaxed max-w-2xl mx-auto" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-[auto,1fr] gap-spacing-2xl items-start">
        {/* Contact Info - Left side */}
        <ScrollReveal delay={0.1} direction="left" distance={30} className="min-w-0">
          <div className="flex flex-col gap-spacing-md">
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex flex-col gap-spacing-xs rounded-lg border border-border/15 p-spacing-lg hover:border-border/30 transition-colors group"
                style={{ background: "radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 70%)" }}
              >
                <div className="flex items-center gap-spacing-sm">
                  <Mail className="h-5 w-5 shrink-0 text-foreground" />
                  <span className="text-sm font-medium text-foreground">E-mail</span>
                </div>
                <span className="text-sm text-muted group-hover:text-foreground transition-colors">{contactInfo.email}</span>
              </a>
            )}
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="flex flex-col gap-spacing-xs rounded-lg border border-border/15 p-spacing-lg hover:border-border/30 transition-colors group"
                style={{ background: "radial-gradient(ellipse at 100% 100%, color-mix(in srgb, var(--primary) 15%, transparent) 0%, transparent 70%)" }}
              >
                <div className="flex items-center gap-spacing-sm">
                  <Phone className="h-5 w-5 shrink-0 text-foreground" />
                  <span className="text-sm font-medium text-foreground">Phone</span>
                </div>
                <span className="text-sm text-muted group-hover:text-foreground transition-colors">{contactInfo.phone}</span>
              </a>
            )}
          </div>
        </ScrollReveal>

        {/* Contact Form - Right side */}
        <ScrollReveal delay={0.1} direction="right" distance={30} className="min-w-0">
          <form onSubmit={handleSubmit} className="space-y-spacing-lg rounded-lg border border-border/15 p-6 sm:p-spacing-2xl overflow-hidden">
            <div className="grid sm:grid-cols-2 gap-spacing-lg">
              <div className="space-y-spacing-xs">
                <Label htmlFor="name" className="text-foreground text-sm">
                  {form?.nameLabel || "Name"}
                </Label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  placeholder={form?.namePlaceholder}
                  required
                  disabled={status === "loading"}
                  className="bg-transparent border-border/30 text-foreground"
                />
              </div>
              <div className="space-y-spacing-xs">
                <Label htmlFor="email" className="text-foreground text-sm">
                  {form?.emailLabel || "Email"}
                </Label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  placeholder={form?.emailPlaceholder}
                  required
                  disabled={status === "loading"}
                  className="bg-transparent border-border/30 text-foreground"
                />
              </div>
            </div>
            {(form?.selectFields ?? []).map((field: SelectField) => (
              <div key={field.name} className="space-y-spacing-xs">
                {field.label && (
                  <Label htmlFor={field.name} className="text-foreground text-sm">
                    {field.label}
                  </Label>
                )}
                <select
                  id={field.name}
                  name={field.name}
                  disabled={status === "loading"}
                  className="w-full min-w-0 rounded-md border border-border/30 bg-transparent text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  defaultValue="__placeholder__"
                >
                  {field.placeholder && (
                    <option value="__placeholder__" disabled>
                      {field.placeholder}
                    </option>
                  )}
                  {field.options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            ))}
            <div className="space-y-spacing-xs">
              <Label htmlFor="message" className="text-foreground text-sm">
                {form?.messageLabel || "Message"}
              </Label>
              <Textarea
                id="message"
                name="message"
                placeholder={form?.messagePlaceholder}
                rows={5}
                required
                disabled={status === "loading"}
                className="bg-transparent border-border/30 text-foreground"
              />
            </div>
            {turnstileSiteKey && (
              <Turnstile
                siteKey={turnstileSiteKey}
                onSuccess={setTurnstileToken}
                onExpire={() => setTurnstileToken(null)}
              />
            )}
            {status === "error" && (
              <div className="flex items-center gap-spacing-xs text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>Something went wrong. Please try again.</span>
              </div>
            )}
            {status === "success" && (
              <div className="flex items-center gap-spacing-xs text-sm text-green-400">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>Message sent successfully!</span>
              </div>
            )}
            <Button
              type="submit"
              size="lg"
              className="w-full !rounded-md"
              disabled={status === "loading" || (turnstileSiteKey != null && !turnstileToken)}
            >
              {status === "loading" ? "Sending..." : (form?.submitButton || "Submit")}
            </Button>
          </form>
        </ScrollReveal>
      </div>
    </div>
  );
}
