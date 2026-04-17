"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { Turnstile } from "../../atoms/Turnstile";
import type { ContactProfessionalProps, SelectField } from "./types";

export function ContactProfessional({
  title,
  subtitle,
  form,
  info,
  businessId,
  business,
  turnstileSiteKey,
  ctaLabel,
  ctaHref,
  className,
}: ContactProfessionalProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (turnstileSiteKey && !turnstileToken) return;
    setStatus("loading");

    const data = new FormData(e.currentTarget);
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
        (window as any).umami?.track("contact-form-submit");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  const contactInfo = {
    address: business?.business?.contact?.address || info?.address,
    phone: business?.business?.contact?.phone || info?.phone,
    email: business?.business?.contact?.email || info?.email,
    hours: business?.business?.contact?.hours || info?.hours,
  };

  return (
    <div className={cn("grid lg:grid-cols-[5fr,7fr] gap-spacing-2xl items-center", className)}>
      {/* Left — heading + contact info */}
      <ScrollReveal delay={0.1} direction="left" distance={30}>
        <div className="flex flex-col gap-spacing-2xl">
          {/* Title block */}
          <div className="flex flex-col gap-spacing-md">
            <span
              className="w-8 h-[2px] rounded-full"
              style={{ backgroundColor: "var(--foreground)" }}
            />
            {title && (
              <h2
                className="text-5xl lg:text-6xl font-heading text-foreground leading-tight"
                data-field="header.title"
              >
                {title}
              </h2>
            )}
            {subtitle && (
              <p
                className="text-muted text-base leading-relaxed max-w-xs"
                data-field="header.subtitle"
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* Contact info list */}
          <div className="flex flex-col gap-spacing-md">
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <Phone className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-sm">{contactInfo.phone}</span>
              </a>
            )}
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <Mail className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-sm">{contactInfo.email}</span>
              </a>
            )}
            {contactInfo.address && (
              <div className="flex items-center gap-spacing-md text-foreground">
                <MapPin className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-sm">{contactInfo.address}</span>
              </div>
            )}
            {contactInfo.hours && (
              <div className="flex items-center gap-spacing-md text-foreground">
                <Clock className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-sm">{contactInfo.hours}</span>
              </div>
            )}
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <MessageCircle className="h-4 w-4 shrink-0 text-muted" />
                <span className="text-sm">{ctaLabel}</span>
              </a>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Right — form card */}
      <ScrollReveal delay={0.2} direction="right" distance={30}>
        <div className="bg-card border border-border/20 rounded-2xl shadow-sm p-spacing-2xl">
          <form onSubmit={handleSubmit} className="space-y-spacing-lg">
            {/* Name + Email row */}
            <div className="grid sm:grid-cols-2 gap-spacing-lg">
              <div className="space-y-spacing-xs">
                <Label htmlFor="prof-name" className="text-foreground text-sm font-medium">
                  {form?.nameLabel || "Name"}
                </Label>
                <Input
                  type="text"
                  id="prof-name"
                  name="name"
                  placeholder={form?.namePlaceholder}
                  required
                  disabled={status === "loading"}
                  className="bg-background border-transparent focus-visible:border-border/40 text-foreground"
                />
              </div>
              <div className="space-y-spacing-xs">
                <Label htmlFor="prof-email" className="text-foreground text-sm font-medium">
                  {form?.emailLabel || "Email"}
                </Label>
                <Input
                  type="email"
                  id="prof-email"
                  name="email"
                  placeholder={form?.emailPlaceholder}
                  required
                  disabled={status === "loading"}
                  className="bg-background border-transparent focus-visible:border-border/40 text-foreground"
                />
              </div>
            </div>

            {/* Optional select fields */}
            {(form?.selectFields ?? []).map((field: SelectField) => (
              <div key={field.name} className="space-y-spacing-xs">
                {field.label && (
                  <Label htmlFor={`prof-${field.name}`} className="text-foreground text-sm font-medium">
                    {field.label}
                  </Label>
                )}
                <select
                  id={`prof-${field.name}`}
                  name={field.name}
                  disabled={status === "loading"}
                  className="w-full min-w-0 rounded-md border-0 bg-secondary/60 text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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

            {/* Message */}
            <div className="space-y-spacing-xs">
              <Label htmlFor="prof-message" className="text-foreground text-sm font-medium">
                {form?.messageLabel || "Message"}
              </Label>
              <Textarea
                id="prof-message"
                name="message"
                placeholder={form?.messagePlaceholder}
                rows={6}
                required
                disabled={status === "loading"}
                className="bg-background border-transparent focus-visible:border-border/40 text-foreground"
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
              className="w-full !rounded-lg"
              disabled={status === "loading" || (turnstileSiteKey != null && !turnstileToken)}
            >
              {status === "loading" ? "Sending..." : form?.submitButton || "Submit"}
            </Button>
          </form>
        </div>
      </ScrollReveal>
    </div>
  );
}
