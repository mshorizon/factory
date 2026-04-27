import Anthropic from "@anthropic-ai/sdk";

const LANG_NAMES: Record<string, string> = {
  pl: "Polish",
  en: "English",
  de: "German",
  uk: "Ukrainian",
};

const INTRO_BY_LANG: Record<string, string> = {
  pl: "Skontaktuj się z nami, aby umówić wizytę.",
  en: "Contact us to schedule an appointment.",
  de: "Kontaktieren Sie uns, um einen Termin zu vereinbaren.",
  uk: "Зв'яжіться з нами, щоб призначити зустріч.",
};

/**
 * Generates rich HTML content for a service detail page using Anthropic.
 * Returns null if the API key is missing or generation fails.
 */
export async function generateServiceContent(params: {
  title: string;
  description: string;
  lang: string;
  businessName: string;
  industry?: string | null;
}): Promise<string | null> {
  const apiKey = import.meta.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const { title, description, lang, businessName, industry } = params;
  const langName = LANG_NAMES[lang] ?? "Polish";
  const closing = INTRO_BY_LANG[lang] ?? INTRO_BY_LANG.pl;

  const client = new Anthropic({ apiKey });

  const system = `You write professional service detail pages for ${businessName}, a ${industry ?? "professional services"} office.
Output ONLY the HTML body content — no <html>, <body>, or wrapper divs.
Allowed tags: <h2>, <h3>, <h4>, <p>, <ul>, <li>, <strong>.
Do NOT repeat the service title as <h1> — it is already the page heading.
Language: ${langName}. Tone: professional, clear, trustworthy.`;

  const user = `Write a detailed service page for:

Title: ${title}
Description: ${description}

Include these sections (use <h2> headings, <p>, <ul>/<li> where appropriate):
1. What this service involves (2–3 sentences)
2. Common situations when this service is needed (bullet list)
3. Documents / information to prepare (bullet list)
4. How the process works step by step (short numbered or bullet list)
5. A closing sentence: "${closing}"

Write in ${langName}. Keep it concise but informative.`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: user }],
    });

    const block = message.content.find((b) => b.type === "text");
    return block && block.type === "text" ? block.text.trim() : null;
  } catch {
    return null;
  }
}
