"use client";

import { useState } from "react";
import { MapPin, Phone, Mail, Clock, CheckCircle, AlertCircle } from "lucide-react";
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
  businessId,
  className,
}: ContactSplitProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
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
    <div className={cn("max-w-6xl mx-auto", className)}>
      {(title || subtitle) && (
        <ScrollReveal delay={0} direction="up">
          <div className="text-center mb-12">
            {title && (
              <h1 className="text-4xl font-bold text-foreground mb-2" data-field="header.title">{title}</h1>
            )}
            {subtitle && (
              <p className="text-muted" data-field="header.subtitle">{subtitle}</p>
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
                  <div className="flex items-start gap-4" data-field="info.address">
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
                  <div className="flex items-start gap-4" data-field="info.phone">
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
                  <div className="flex items-start gap-4" data-field="info.email">
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
                  <div className="flex items-start gap-4" data-field="info.hours">
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
          {status === "success" ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] space-y-4 bg-background border border-border rounded-radius p-8 shadow-sm text-center">
              <CheckCircle className="h-16 w-16 text-primary" />
              <h3 className="text-xl font-bold text-foreground">Message Sent!</h3>
              <p className="text-muted">Thank you for reaching out. We'll get back to you as soon as possible.</p>
              <Button variant="outline" onClick={() => setStatus("idle")}>Send another message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 bg-background border border-border rounded-radius p-8 shadow-sm">
              <div className="space-y-2" data-field="form.nameLabel">
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
              <div className="space-y-2" data-field="form.emailLabel">
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
              <div className="space-y-2" data-field="form.messageLabel">
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
              {status === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>Something went wrong. Please try again.</span>
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                data-field="form.submitButton"
                disabled={status === "loading"}
              >
                {status === "loading" ? "Sending..." : (form?.submitButton || "Send Message")}
              </Button>
            </form>
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
