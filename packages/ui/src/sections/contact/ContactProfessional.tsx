"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle } from "lucide-react";
import { MapPinIcon, PhoneIcon, EnvelopeIcon, ClockIcon, ChatBubbleOvalLeftIcon, UserGroupIcon, InformationCircleIcon } from "@heroicons/react/24/solid";
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
  iconColor = "primary-light",
  submitButtonColor = "primary-light",
  headerLineColor = "foreground",
  formBackground = "light",
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

  const iconCls = `h-5 w-5 ${iconColor === "primary" ? "text-primary" : "text-primary-light"} shrink-0`;

  const contactInfo = {
    address: business?.business?.contact?.address || info?.address,
    phone: business?.business?.contact?.phone || info?.phone,
    email: business?.business?.contact?.email || info?.email,
    hours: business?.business?.contact?.hours || info?.hours,
    hoursDetailed: info?.hoursDetailed,
    receptionHours: info?.receptionHours,
    receptionLabel: info?.receptionLabel,
    additionalInfo: info?.additionalInfo,
    notice: info?.notice,
    warning: info?.warning,
  };

  return (
    <div className={cn("flex flex-col gap-spacing-2xl", className)}>
    {contactInfo.warning && (
      <ScrollReveal delay={0.05} direction="up" distance={20}>
        <div
          role="alert"
          className="flex items-start gap-spacing-md rounded-radius border border-primary bg-primary/10 p-spacing-lg text-foreground"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-primary mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          <p className="text-base font-medium leading-relaxed">{contactInfo.warning}</p>
        </div>
      </ScrollReveal>
    )}
    <div className="grid lg:grid-cols-[5fr,7fr] gap-spacing-2xl items-center">
      {/* Left — heading + contact info */}
      <ScrollReveal delay={0.1} direction="left" distance={30}>
        <div className="flex flex-col gap-spacing-2xl">
          {/* Title block */}
          <div className="flex flex-col gap-spacing-md">
            <span
              className="w-8 h-[2px] rounded-full"
              style={{ backgroundColor: headerLineColor === "primary" ? "var(--primary)" : "var(--foreground)" }}
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

          {/* Divider */}
          <hr className="border-0 border-t border-border/40" />

          {/* Contact info list */}
          <div className="flex flex-col gap-spacing-md">
            {contactInfo.phone && (
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <PhoneIcon className={iconCls} />
                <span className="text-sm">{contactInfo.phone}</span>
              </a>
            )}
            {contactInfo.email && (
              <a
                href={`mailto:${contactInfo.email}`}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <EnvelopeIcon className={iconCls} />
                <span className="text-sm">{contactInfo.email}</span>
              </a>
            )}
            {contactInfo.address && (
              <div className="flex items-center gap-spacing-md text-foreground">
                <MapPinIcon className={iconCls} />
                <span className="text-sm">{contactInfo.address}</span>
              </div>
            )}
            {(contactInfo.hours || (contactInfo.hoursDetailed && contactInfo.hoursDetailed.length > 0)) && (
              <div className="flex items-start gap-spacing-md text-foreground">
                <ClockIcon className={iconCls} />
                <div className="flex flex-col gap-spacing-xs">
                  {contactInfo.hours && (
                    <span className="text-sm font-medium">{contactInfo.hours}</span>
                  )}
                  {contactInfo.hoursDetailed?.map((line) => (
                    <span key={line} className="text-sm text-muted">{line}</span>
                  ))}
                </div>
              </div>
            )}
            {contactInfo.receptionHours && (
              <div className="flex items-start gap-spacing-md text-foreground">
                <UserGroupIcon className={iconCls} />
                <div className="flex flex-col gap-spacing-xs">
                  {contactInfo.receptionLabel && (
                    <span className="text-sm font-medium">{contactInfo.receptionLabel}</span>
                  )}
                  <span className="text-sm text-muted">{contactInfo.receptionHours}</span>
                </div>
              </div>
            )}
            {contactInfo.additionalInfo?.map((item) => (
              <div key={item} className="flex items-start gap-spacing-md text-foreground">
                <InformationCircleIcon className={cn(iconCls, "mt-0.5")} />
                <span className="text-sm">{item}</span>
              </div>
            ))}
            {ctaLabel && ctaHref && (
              <a
                href={ctaHref}
                className="flex items-center gap-spacing-md text-foreground hover:opacity-70 transition-opacity"
              >
                <ChatBubbleOvalLeftIcon className={iconCls} />
                <span className="text-sm">{ctaLabel}</span>
              </a>
            )}
          </div>
        </div>
      </ScrollReveal>

      {/* Right — form card */}
      <ScrollReveal delay={0.2} direction="right" distance={30}>
        <div className={cn(
          "rounded-2xl shadow-sm p-spacing-2xl",
          formBackground === "dark" ? "bg-secondary" : "bg-card"
        )}>
          <form onSubmit={handleSubmit} className="space-y-spacing-lg">
            {/* Name + Email row */}
            <div className="grid sm:grid-cols-2 gap-spacing-lg">
              <div className="space-y-spacing-xs">
                <Label htmlFor="prof-name" className={cn("text-sm font-medium", formBackground === "dark" ? "text-white" : "text-foreground")}>
                  {form?.nameLabel || "Name"}
                </Label>
                <Input
                  type="text"
                  id="prof-name"
                  name="name"
                  placeholder={form?.namePlaceholder}
                  required
                  disabled={status === "loading"}
                  className={cn("rounded-sm", formBackground === "dark" ? "bg-white text-foreground border-transparent" : "bg-background border-transparent focus-visible:border-border/40 text-foreground")}
                />
              </div>
              <div className="space-y-spacing-xs">
                <Label htmlFor="prof-email" className={cn("text-sm font-medium", formBackground === "dark" ? "text-white" : "text-foreground")}>
                  {form?.emailLabel || "Email"}
                </Label>
                <Input
                  type="email"
                  id="prof-email"
                  name="email"
                  placeholder={form?.emailPlaceholder}
                  required
                  disabled={status === "loading"}
                  className={cn("rounded-sm", formBackground === "dark" ? "bg-white text-foreground border-transparent" : "bg-background border-transparent focus-visible:border-border/40 text-foreground")}
                />
              </div>
            </div>

            {/* Optional select fields */}
            {(form?.selectFields ?? []).map((field: SelectField) => (
              <div key={field.name} className="space-y-spacing-xs">
                {field.label && (
                  <Label htmlFor={`prof-${field.name}`} className={cn("text-sm font-medium", formBackground === "dark" ? "text-white" : "text-foreground")}>
                    {field.label}
                  </Label>
                )}
                <select
                  id={`prof-${field.name}`}
                  name={field.name}
                  disabled={status === "loading"}
                  className={cn(
                    "w-full min-w-0 rounded-sm border-0 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground",
                    formBackground === "dark" ? "bg-white" : "bg-secondary/60"
                  )}
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
              <Label htmlFor="prof-message" className={cn("text-sm font-medium", formBackground === "dark" ? "text-white" : "text-foreground")}>
                {form?.messageLabel || "Message"}
              </Label>
              <Textarea
                id="prof-message"
                name="message"
                placeholder={form?.messagePlaceholder}
                rows={10}
                required
                disabled={status === "loading"}
                className={cn("rounded-sm", formBackground === "dark" ? "bg-white text-foreground border-transparent" : "bg-background border-transparent focus-visible:border-border/40 text-foreground")}
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
              className={cn(
                "w-full !rounded-lg !text-on-primary",
                submitButtonColor === "primary"
                  ? "!bg-primary hover:!bg-primary/90"
                  : "!bg-primary-light hover:!bg-primary-light/90"
              )}
              disabled={status === "loading" || (turnstileSiteKey != null && !turnstileToken)}
            >
              {status === "loading" ? "Sending..." : form?.submitButton || "Submit"}
            </Button>
          </form>
        </div>
      </ScrollReveal>
    </div>
    {contactInfo.notice && (contactInfo.notice.title || contactInfo.notice.highlight || contactInfo.notice.description) && (
      <ScrollReveal delay={0.15} direction="up" distance={20}>
        <div className="bg-card rounded-2xl shadow-sm p-spacing-2xl text-center flex flex-col gap-spacing-sm">
          {contactInfo.notice.title && (
            <p className="text-foreground text-base leading-relaxed">{contactInfo.notice.title}</p>
          )}
          {contactInfo.notice.highlight && (
            <p className="text-foreground text-xl font-semibold tracking-wide">
              {contactInfo.notice.highlight}
            </p>
          )}
          {contactInfo.notice.description && (
            <p className="text-muted text-sm leading-relaxed max-w-2xl mx-auto">
              {contactInfo.notice.description}
            </p>
          )}
        </div>
      </ScrollReveal>
    )}
    </div>
  );
}
