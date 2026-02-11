import { OCR_PROMPT } from "./prompt";

/**
 * Qwen VL adapter — calls vLLM on RunPod via OpenAI-compatible endpoint.
 * Accepts a data URI (data:image/jpeg;base64,...).
 */
export async function callQwen(imageDataUri: string): Promise<string> {
  const host = process.env.VLLM_HOST;
  const model = process.env.VLLM_MODEL;

  if (!host || !model) {
    throw new Error("VLLM_HOST or VLLM_MODEL not configured");
  }

  const url = `${host.replace(/\/$/, "")}/v1/chat/completions`;
  const timeoutMs = parseInt(process.env.VLM_TIMEOUT_MS || "12000", 10);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: OCR_PROMPT },
              { type: "image_url", image_url: { url: imageDataUri } },
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
      throw new Error(`vLLM API error ${resp.status}: ${body}`);
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("vLLM returned empty or malformed response");
    }
    return content;
  } finally {
    clearTimeout(timer);
  }
}
