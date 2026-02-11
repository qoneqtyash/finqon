import { OCR_PROMPT } from "./prompt";

const OPENAI_TIMEOUT_MS = 30000; // 30 seconds

/**
 * GPT-4o Vision adapter — uses the OpenAI REST API directly.
 * Accepts a data URI (data:image/jpeg;base64,...).
 */
export async function callOpenAI(imageDataUri: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              { type: "image_url", image_url: { url: imageDataUri, detail: "high" } },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      }),
      signal: controller.signal,
    });

    if (!resp.ok) {
      const body = await resp.text();
      throw new Error(`OpenAI API error ${resp.status}: ${body}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("OpenAI returned empty or malformed response");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}
