import translate from "google-translate-api-x";
import { getCache, setCache } from "./cache";

const TRANSLATION_TTL = 30 * 60 * 1000; // 30 minutes

export async function translateToJapanese(
  title: string,
  summary: string
): Promise<{ titleJa: string; summaryJa: string }> {
  const cacheKey = `translate::${title.slice(0, 50)}`;
  const cached = getCache<{ titleJa: string; summaryJa: string }>(cacheKey);
  if (cached) return cached;

  try {
    const [titleRes, summaryRes] = await Promise.all([
      translate(title, { from: "en", to: "ja" }),
      summary
        ? translate(summary, { from: "en", to: "ja" })
        : Promise.resolve({ text: "" }),
    ]);

    const result = {
      titleJa: titleRes.text || title,
      summaryJa: summaryRes.text || summary,
    };

    setCache(cacheKey, result, TRANSLATION_TTL);
    return result;
  } catch (err) {
    console.error("[Translate] Failed:", err);
    return { titleJa: title, summaryJa: summary };
  }
}
