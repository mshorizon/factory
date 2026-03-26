import webpush from "web-push";
import { initDb, getSiteBySubdomain, getPushSubscriptionsBySiteId, deactivatePushSubscription } from "@mshorizon/db";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = import.meta.env.VAPID_PUBLIC_KEY;
  const privateKey = import.meta.env.VAPID_PRIVATE_KEY;
  const subject = import.meta.env.VAPID_SUBJECT || "mailto:noreply@hazelgrouse.pl";

  if (!publicKey || !privateKey) {
    throw new Error("VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY env vars are required");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
}

export async function sendPushToSiteSubscribers(
  siteId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  ensureVapid();

  const subscriptions = await getPushSubscriptionsBySiteId(siteId);
  let sent = 0;
  let failed = 0;

  for (const sub of subscriptions) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
      sent++;
    } catch (err: any) {
      failed++;
      // 410 Gone = subscription expired/invalid, deactivate it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await deactivatePushSubscription(sub.endpoint);
      }
    }
  }

  return { sent, failed };
}
