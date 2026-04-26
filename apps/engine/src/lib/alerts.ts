import { Resend } from "resend";
import { getRecentAlerts, insertAlert, getSiteBySubdomain } from "@mshorizon/db";
import type { HealthCheck } from "@mshorizon/db";
import logger from "./logger";

export async function sendEmailAlert(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY || (import.meta as any).env?.RESEND_API_KEY;
  if (!apiKey) {
    logger.warn("Cannot send email alert: RESEND_API_KEY not configured");
    return;
  }
  const resend = new Resend(apiKey);
  const from = process.env.ALERT_EMAIL_FROM || "noreply@contact.hazelgrouse.pl";

  try {
    await resend.emails.send({ from, to, subject, html });
    logger.info({ to, subject }, "Email alert sent");
  } catch (error) {
    logger.error({ err: error, to, subject }, "Failed to send email alert");
  }
}

export async function sendSlackAlert(webhookUrl: string, text: string) {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      logger.error({ status: res.status }, "Slack webhook returned non-OK status");
    } else {
      logger.info("Slack alert sent");
    }
  } catch (error) {
    logger.error({ err: error }, "Failed to send Slack alert");
  }
}

async function shouldAlert(siteId: number, alertType: string, cooldownMinutes = 30): Promise<boolean> {
  try {
    const recent = await getRecentAlerts(siteId, cooldownMinutes / 60);
    return !recent.some((a) => a.type === alertType);
  } catch {
    return true; // If we can't check, allow the alert
  }
}

export async function processHealthAlert(subdomain: string, checkResult: HealthCheck) {
  if (checkResult.status === "healthy") return;

  const site = await getSiteBySubdomain(subdomain);
  if (!site || !checkResult.siteId) return;

  const config = site.config as any;
  const monitoring = config?.monitoring;
  if (monitoring?.alertsEnabled === false) return;

  const cooldown = monitoring?.cooldownMinutes ?? 30;
  const alertType = "health_check_failure";

  if (!(await shouldAlert(checkResult.siteId, alertType, cooldown))) {
    logger.debug({ subdomain }, "Alert suppressed by cooldown");
    return;
  }

  const statusLabel = checkResult.status === "unhealthy" ? "NIEDOSTĘPNY" : "ZDEGRADOWANY";
  const message = `[${statusLabel}] Serwis ${subdomain} — status: ${checkResult.status}`;

  // Email alert — always notify studio, optionally notify client
  const studioEmail = process.env.STUDIO_ALERT_EMAIL || (import.meta as any).env?.STUDIO_ALERT_EMAIL;
  const clientEmail = monitoring?.alertEmail || config?.business?.contact?.email;
  const emailHtml = `<h2>Alert: ${subdomain}</h2><p>Status: <strong>${checkResult.status}</strong></p><p>Checks: <pre>${JSON.stringify(checkResult.checks, null, 2)}</pre></p><p>Czas: ${new Date().toLocaleString("pl-PL")}</p>`;
  const emailSubject = `${statusLabel}: ${subdomain}`;

  const emailTargets = [...new Set([studioEmail, clientEmail].filter(Boolean))] as string[];
  for (const emailTo of emailTargets) {
    await sendEmailAlert(emailTo, emailSubject, emailHtml);
  }

  if (emailTargets.length > 0) {
    await insertAlert({
      siteId: checkResult.siteId,
      type: alertType,
      channel: "email",
      message,
      metadata: { checks: checkResult.checks, recipients: emailTargets },
    });
  }

  // Slack alert
  const slackUrl = monitoring?.slackWebhookUrl || process.env.SLACK_WEBHOOK_URL;
  if (slackUrl) {
    await sendSlackAlert(slackUrl, message);
    await insertAlert({
      siteId: checkResult.siteId,
      type: alertType,
      channel: "slack",
      message,
      metadata: { checks: checkResult.checks },
    });
  }
}
