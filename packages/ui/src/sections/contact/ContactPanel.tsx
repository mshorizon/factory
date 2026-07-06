"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { pageSurfaceVars } from "../../lib/pageSurface";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { Turnstile } from "../../atoms/Turnstile";
import type { ContactPanelProps, SelectField } from "./types";

export function ContactPanel({
  badge,
  title,
  subtitle,
  form,
  businessId,
  turnstileSiteKey,
  className,
}: ContactPanelProps) {
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

  return (
    <div className={cn("grid lg:grid-cols-[5fr_7fr] gap-spacing-2xl lg:gap-spacing-3xl items-center", className)}>
      {/* Left — kicker + heading */}
      <ScrollReveal delay={0.1} direction="left" distance={30}>
        <div className="flex flex-col">
          {badge && (
            <p
              className="font-mono text-xs font-bold tracking-[.16em] uppercase text-primary mb-spacing-md"
              data-field="header.badge"
            >
              {badge}
            </p>
          )}
          {title && (
            <h2
              className="text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-tight mb-spacing-md font-heading"
              data-field="header.title"
            >
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-muted text-base leading-relaxed max-w-md" data-field="header.subtitle">
              {subtitle}
            </p>
          )}
        </div>
      </ScrollReveal>

      {/* Right — form card (stays light on dark sections) */}
      <ScrollReveal delay={0.2} direction="right" distance={30}>
        <div
          className="bg-card rounded-3xl shadow-2xl p-spacing-xl lg:p-spacing-2xl"
          style={pageSurfaceVars}
        >
          <form onSubmit={handleSubmit} className="space-y-spacing-lg">
            <div className="space-y-spacing-xs">
              <Label htmlFor="cp-name" className="text-foreground text-sm font-semibold">
                {form?.nameLabel || "Name"}
              </Label>
              <Input
                type="text"
                id="cp-name"
                name="name"
                placeholder={form?.namePlaceholder}
                required
                disabled={status === "loading"}
                className="bg-card border-border text-foreground rounded-lg"
              />
            </div>
            <div className="space-y-spacing-xs">
              <Label htmlFor="cp-email" className="text-foreground text-sm font-semibold">
                {form?.emailLabel || "Email"}
              </Label>
              <Input
                type="email"
                id="cp-email"
                name="email"
                placeholder={form?.emailPlaceholder}
                required
                disabled={status === "loading"}
                className="bg-card border-border text-foreground rounded-lg"
              />
            </div>

            {(form?.selectFields ?? []).map((field: SelectField) => (
              <div key={field.name} className="space-y-spacing-xs">
                {field.label && (
                  <Label htmlFor={`cp-${field.name}`} className="text-foreground text-sm font-semibold">
                    {field.label}
                  </Label>
                )}
                <select
                  id={`cp-${field.name}`}
                  name={field.name}
                  disabled={status === "loading"}
                  className="w-full min-w-0 rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
              <Label htmlFor="cp-message" className="text-foreground text-sm font-semibold">
                {form?.messageLabel || "Message"}
              </Label>
              <Textarea
                id="cp-message"
                name="message"
                placeholder={form?.messagePlaceholder}
                rows={4}
                required
                disabled={status === "loading"}
                className="bg-card border-border text-foreground rounded-lg"
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
              className="w-full !rounded-full font-bold shadow-lg shadow-primary/25"
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
