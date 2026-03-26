import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellOff, MessageSquare, Smartphone, Check, AlertCircle, Loader2 } from "lucide-react";

interface NotificationsConfig {
  sms?: {
    enabled?: boolean;
    provider?: "smsapi" | "twilio";
    phoneNumber?: string;
    apiToken?: string;
    senderName?: string;
    template?: string;
  };
  push?: {
    enabled?: boolean;
  };
}

interface NotificationsTabProps {
  businessId: string;
  notifications: NotificationsConfig;
  onChange: (notifications: NotificationsConfig) => void;
}

type PushStatus = "unknown" | "unsupported" | "denied" | "default" | "granted" | "subscribed";

export function NotificationsTab({ businessId, notifications, onChange }: NotificationsTabProps) {
  const sms = notifications?.sms || {};
  const push = notifications?.push || {};

  const [pushStatus, setPushStatus] = useState<PushStatus>("unknown");
  const [pushLoading, setPushLoading] = useState(false);
  const [smsTestStatus, setSmsTestStatus] = useState<"idle" | "sending" | "ok" | "error">("idle");
  const [smsTestError, setSmsTestError] = useState<string>();

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushStatus("unsupported");
      return;
    }
    navigator.serviceWorker.ready.then(async (reg) => {
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setPushStatus("subscribed");
      } else {
        setPushStatus(Notification.permission as PushStatus);
      }
    });
  }, []);

  const handleSmsChange = (field: keyof NonNullable<NotificationsConfig["sms"]>, value: string | boolean) => {
    onChange({ ...notifications, sms: { ...sms, [field]: value } });
  };

  const handlePushChange = (field: keyof NonNullable<NotificationsConfig["push"]>, value: boolean) => {
    onChange({ ...notifications, push: { ...push, [field]: value } });
  };

  const subscribeToPush = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    setPushLoading(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushStatus("denied");
        return;
      }

      const keyRes = await fetch("/api/notifications/vapid-public-key");
      const { publicKey } = await keyRes.json();
      if (!publicKey) throw new Error("VAPID key not available");

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      await fetch("/api/notifications/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, subscription: sub.toJSON() }),
      });

      setPushStatus("subscribed");
    } catch (err) {
      console.error("Push subscribe failed:", err);
      setPushStatus("default");
    } finally {
      setPushLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!("serviceWorker" in navigator)) return;
    setPushLoading(true);

    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/notifications/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setPushStatus("default");
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    } finally {
      setPushLoading(false);
    }
  };

  const testSms = async () => {
    if (!sms.apiToken || !sms.phoneNumber) return;
    setSmsTestStatus("sending");
    setSmsTestError(undefined);

    try {
      const res = await fetch("/api/admin/notifications/test-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessId,
          provider: sms.provider || "smsapi",
          apiToken: sms.apiToken,
          phoneNumber: sms.phoneNumber,
          senderName: sms.senderName,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setSmsTestStatus("error");
        setSmsTestError(data.error || "Unknown error");
      } else {
        setSmsTestStatus("ok");
        setTimeout(() => setSmsTestStatus("idle"), 3000);
      }
    } catch (err) {
      setSmsTestStatus("error");
      setSmsTestError(err instanceof Error ? err.message : "Request failed");
    }
  };

  return (
    <div className="space-y-6">
      {/* SMS Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-4 w-4" />
            SMS Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={sms.enabled ?? false}
              onChange={(e) => handleSmsChange("enabled", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium">Enable SMS notifications on new contact message</span>
          </label>

          {sms.enabled && (
            <div className="space-y-4 pt-2 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-muted-foreground">Provider</label>
                  <select
                    value={sms.provider || "smsapi"}
                    onChange={(e) => handleSmsChange("provider", e.target.value as "smsapi" | "twilio")}
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                  >
                    <option value="smsapi">SMSAPI</option>
                    <option value="twilio">Twilio</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-medium text-muted-foreground">
                    Recipient Phone Number
                  </label>
                  <input
                    type="text"
                    value={sms.phoneNumber || ""}
                    onChange={(e) => handleSmsChange("phoneNumber", e.target.value)}
                    placeholder="+48500600700"
                    className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">
                  API Token / Auth Key
                  {sms.provider === "twilio" && (
                    <span className="text-muted-foreground/60 font-normal"> (format: ACCOUNT_SID:AUTH_TOKEN)</span>
                  )}
                </label>
                <input
                  type="password"
                  value={sms.apiToken || ""}
                  onChange={(e) => handleSmsChange("apiToken", e.target.value)}
                  placeholder={sms.provider === "twilio" ? "ACxxxxx:auth_token" : "SMSAPI OAuth2 token"}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">
                  Sender Name <span className="font-normal text-muted-foreground/60">(optional, max 11 chars)</span>
                </label>
                <input
                  type="text"
                  value={sms.senderName || ""}
                  onChange={(e) => handleSmsChange("senderName", e.target.value.slice(0, 11))}
                  placeholder="INFO"
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-muted-foreground">
                  Message Template
                  <span className="font-normal text-muted-foreground/60"> — use {`{{name}}`}, {`{{email}}`}, {`{{message}}`}</span>
                </label>
                <textarea
                  value={sms.template || "New message from {{name}} ({{email}}): {{message}}"}
                  onChange={(e) => handleSmsChange("template", e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={testSms}
                  disabled={!sms.apiToken || !sms.phoneNumber || smsTestStatus === "sending"}
                >
                  {smsTestStatus === "sending" ? (
                    <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Sending...</>
                  ) : (
                    <><MessageSquare className="h-3.5 w-3.5 mr-1.5" />Send test SMS</>
                  )}
                </Button>

                {smsTestStatus === "ok" && (
                  <span className="flex items-center gap-1.5 text-sm text-green-600">
                    <Check className="h-3.5 w-3.5" /> Sent!
                  </span>
                )}
                {smsTestStatus === "error" && (
                  <span className="flex items-center gap-1.5 text-sm text-destructive">
                    <AlertCircle className="h-3.5 w-3.5" /> {smsTestError || "Error"}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Web Push Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />
            Web Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={push.enabled ?? false}
              onChange={(e) => handlePushChange("enabled", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm font-medium">Enable Web Push on new contact message</span>
          </label>

          {push.enabled && (
            <div className="space-y-3 pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Subscribe this browser to receive push notifications when someone sends a contact form message.
              </p>

              <div className="flex items-center gap-3">
                {pushStatus === "unsupported" && (
                  <Badge variant="secondary">Not supported in this browser</Badge>
                )}
                {pushStatus === "denied" && (
                  <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                    <BellOff className="h-3 w-3 mr-1" /> Notifications blocked
                  </Badge>
                )}
                {pushStatus === "subscribed" && (
                  <>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                      <Bell className="h-3 w-3 mr-1" /> Subscribed
                    </Badge>
                    <Button size="sm" variant="outline" onClick={unsubscribeFromPush} disabled={pushLoading}>
                      {pushLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Unsubscribe"}
                    </Button>
                  </>
                )}
                {(pushStatus === "default" || pushStatus === "unknown") && pushStatus !== "unsupported" && (
                  <Button size="sm" variant="outline" onClick={subscribeToPush} disabled={pushLoading}>
                    {pushLoading ? (
                      <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Subscribing...</>
                    ) : (
                      <><Bell className="h-3.5 w-3.5 mr-1.5" />Subscribe this browser</>
                    )}
                  </Button>
                )}
              </div>

              {pushStatus === "denied" && (
                <p className="text-xs text-muted-foreground">
                  To enable notifications, allow them in your browser site settings and reload the page.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Convert base64url to Uint8Array for VAPID applicationServerKey
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (char) => char.charCodeAt(0));
}
