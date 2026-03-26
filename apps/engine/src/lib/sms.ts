export interface SmsOptions {
  provider: "smsapi" | "twilio";
  apiToken: string;
  phoneNumber: string;
  message: string;
  senderName?: string;
}

export async function sendSms(opts: SmsOptions): Promise<{ success: boolean; error?: string }> {
  if (opts.provider === "smsapi") {
    return sendViaSmsApi(opts);
  } else {
    return sendViaTwilio(opts);
  }
}

async function sendViaSmsApi(opts: SmsOptions): Promise<{ success: boolean; error?: string }> {
  const params = new URLSearchParams({
    access_token: opts.apiToken,
    to: opts.phoneNumber,
    message: opts.message,
    format: "json",
  });

  if (opts.senderName) {
    params.set("from", opts.senderName);
  } else {
    params.set("from", "INFO");
  }

  try {
    const res = await fetch("https://api.smsapi.pl/sms.do", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await res.json() as any;

    if (data.error) {
      return { success: false, error: `SMSAPI error ${data.error}: ${data.message}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "SMSAPI request failed" };
  }
}

async function sendViaTwilio(opts: SmsOptions): Promise<{ success: boolean; error?: string }> {
  // apiToken format for Twilio: "ACCOUNT_SID:AUTH_TOKEN"
  const [accountSid, authToken] = opts.apiToken.split(":");
  if (!accountSid || !authToken) {
    return { success: false, error: "Twilio apiToken must be in format ACCOUNT_SID:AUTH_TOKEN" };
  }

  const from = opts.senderName || "+15005550006"; // Twilio test number fallback
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const params = new URLSearchParams({
    To: opts.phoneNumber,
    From: from,
    Body: opts.message,
  });

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
      },
      body: params.toString(),
    });

    const data = await res.json() as any;
    if (!res.ok) {
      return { success: false, error: `Twilio error ${data.code}: ${data.message}` };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : "Twilio request failed" };
  }
}

export function renderSmsTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");
}
