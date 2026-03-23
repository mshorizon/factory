import type { APIRoute } from "astro";

/**
 * Translation API endpoint using MyMemory free translation service.
 * MyMemory has a 500 character limit per query, so we chunk long texts.
 *
 * POST { texts: string[], from: "en"|"pl", to: "en"|"pl", isHtml?: boolean }
 * Returns { translations: string[] }
 */

const MAX_CHARS = 480; // Stay safely under MyMemory's 500 char limit

const langMap: Record<string, string> = { en: "en-GB", pl: "pl-PL" };

async function translateChunk(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return text;

  const sourceLang = langMap[from] || from;
  const targetLang = langMap[to] || to;

  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLang}|${targetLang}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Translation API error: ${response.status}`);

  const data = await response.json();
  if (data.responseStatus === 200 && data.responseData?.translatedText) {
    return data.responseData.translatedText;
  }

  throw new Error(data.responseDetails || "Translation failed");
}

/**
 * Split text into chunks at sentence boundaries, staying under MAX_CHARS.
 * Falls back to splitting at word boundaries if sentences are too long.
 */
function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_CHARS) return [text];

  const chunks: string[] = [];
  // Split by sentence-ending punctuation (keep the punctuation with the sentence)
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];

  let current = "";
  for (const sentence of sentences) {
    if (sentence.length > MAX_CHARS) {
      // Sentence itself is too long — split by words
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      const words = sentence.split(/(\s+)/);
      for (const word of words) {
        if ((current + word).length > MAX_CHARS) {
          if (current) chunks.push(current.trim());
          current = word;
        } else {
          current += word;
        }
      }
    } else if ((current + sentence).length > MAX_CHARS) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

async function translateText(text: string, from: string, to: string): Promise<string> {
  if (!text.trim()) return text;

  const chunks = splitIntoChunks(text);
  const translated: string[] = [];
  for (const chunk of chunks) {
    translated.push(await translateChunk(chunk, from, to));
  }
  return translated.join(" ");
}

async function translateHtml(html: string, from: string, to: string): Promise<string> {
  if (!html.trim()) return html;

  // Split HTML into text chunks and tags, translate only text
  const parts = html.split(/(<[^>]+>)/);
  const translated: string[] = [];

  for (const part of parts) {
    if (part.startsWith("<")) {
      translated.push(part);
    } else if (part.trim()) {
      translated.push(await translateText(part, from, to));
    } else {
      translated.push(part);
    }
  }

  return translated.join("");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { texts, from, to, isHtml } = body;

    if (!texts || !Array.isArray(texts) || !from || !to) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: texts (array), from, to" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (from === to) {
      return new Response(
        JSON.stringify({ translations: texts }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const translateFn = isHtml ? translateHtml : translateText;

    // Translate sequentially to respect rate limits
    const translations: string[] = [];
    for (const text of texts) {
      if (!text || !text.trim()) {
        translations.push(text || "");
      } else {
        translations.push(await translateFn(text, from, to));
      }
    }

    return new Response(
      JSON.stringify({ translations }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Translation error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Translation failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
