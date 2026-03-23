"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import { ScrollReveal } from "../../animations/ScrollReveal";
import { Turnstile } from "../../atoms/Turnstile";
import type { ContactCenteredProps } from "./types";

export function ContactCentered({
  title,
  subtitle,
  form,
  businessId,
  turnstileSiteKey,
  className,
}: ContactCenteredProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (turnstileSiteKey && !turnstileToken) {
      return;
    }

    setStatus("loading");

    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.get("name"),
          email: data.get("email"),
          message: data.get("message"),
          businessId,
          turnstileToken,
        }),
      });

      if (res.ok) {
        setStatus("success");
        (e.target as HTMLFormElement).reset();
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {(title || subtitle) && (
        <ScrollReveal delay={0} direction="up">
          <div className="text-center mb-spacing-2xl">
            {title && (
              <h1 className="text-4xl font-bold text-foreground mb-spacing-xs" data-field="header.title">{title}</h1>
            )}
            {subtitle && (
              <p className="text-muted" data-field="header.subtitle">{subtitle}</p>
            )}
          </div>
        </ScrollReveal>
      )}

      <ScrollReveal delay={0.1} direction="up">
        <form onSubmit={handleSubmit} className="space-y-spacing-lg bg-background border border-border rounded-radius-secondary p-spacing-2xl shadow-sm">
          <div className="space-y-spacing-xs" data-field="form.nameLabel">
            <Label htmlFor="name" className="text-foreground">
              {form?.nameLabel || "Name"}
            </Label>
            <Input
              type="text"
              id="name"
              name="name"
              placeholder={form?.namePlaceholder}
              required
              disabled={status === "loading"}
            />
          </div>
          <div className="space-y-spacing-xs" data-field="form.emailLabel">
            <Label htmlFor="email" className="text-foreground">
              {form?.emailLabel || "Email"}
            </Label>
            <Input
              type="email"
              id="email"
              name="email"
              placeholder={form?.emailPlaceholder}
              required
              disabled={status === "loading"}
            />
          </div>
          <div className="space-y-spacing-xs" data-field="form.messageLabel">
            <Label htmlFor="message" className="text-foreground">
              {form?.messageLabel || "Message"}
            </Label>
            <Textarea
              id="message"
              name="message"
              placeholder={form?.messagePlaceholder}
              rows={5}
              required
              disabled={status === "loading"}
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
            <div className="flex items-center gap-spacing-xs text-sm text-red-500">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Something went wrong. Please try again.</span>
            </div>
          )}
          {status === "success" && (
            <div className="flex items-center gap-spacing-xs text-sm text-green-500">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <span>Message sent successfully!</span>
            </div>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full"
            data-field="form.submitButton"
            disabled={status === "loading" || (turnstileSiteKey != null && !turnstileToken)}
          >
            {status === "loading" ? "Sending..." : (form?.submitButton || "Send Message")}
          </Button>
        </form>
      </ScrollReveal>
    </div>
  );
}
