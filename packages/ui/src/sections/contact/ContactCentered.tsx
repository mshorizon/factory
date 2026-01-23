import { cn } from "../../lib/utils";
import { Button } from "../../atoms/Button";
import { Input } from "../../atoms/Input";
import { Label } from "../../atoms/Label";
import { Textarea } from "../../atoms/Textarea";
import type { ContactCenteredProps } from "./types";

export function ContactCentered({
  title,
  subtitle,
  form,
  className,
}: ContactCenteredProps) {
  return (
    <div className={cn("max-w-2xl mx-auto", className)}>
      {title && (
        <h1 className="text-4xl font-bold text-foreground mb-2 text-center">{title}</h1>
      )}
      {subtitle && (
        <p className="text-muted text-center mb-8">{subtitle}</p>
      )}

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
    </div>
  );
}
