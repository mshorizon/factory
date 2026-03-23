export async function verifyTurnstile(token: string, remoteip?: string): Promise<boolean> {
  const secret = import.meta.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // skip if not configured

  const body: Record<string, string> = { secret, response: token };
  if (remoteip) body.remoteip = remoteip;

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return data.success === true;
}
