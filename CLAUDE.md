# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start dev server
- `npm run build` — production build (use to verify changes compile)
- `npm run lint` — ESLint

## Architecture

Next.js 16 App Router (TypeScript, Tailwind v4) deployed on **Vercel**.

**Flow:** Upload receipt images/PDFs/DOCX → extract images → OCR via VLM → editable Cash Voucher form → download PDF.

### API Routes

- `/api/process` — Extracts images from uploaded files (DOCX via JSZip, PDF via pdfjs-dist, direct images via sharp). Returns base64 image array. `maxDuration = 60`.
- `/api/ocr` — Single image OCR. Sends to vLLM (Qwen3-VL-8B on RunPod) with GPT-4o fallback. `maxDuration = 60`.

### VLM Failover (`src/lib/vlm/`)

1. **Qwen** (`qwen.ts`) — vLLM on RunPod, OpenAI-compatible endpoint. Uses `chat_template_kwargs: { enable_thinking: false }` to disable Qwen3 thinking mode.
2. **GPT-4o** (`openai.ts`) — fallback with 30s AbortController timeout.
3. **client.ts** — tries Qwen first, falls back to OpenAI on failure. Logs raw responses server-side.
4. **parse-response.ts** — strips `<think>` blocks before JSON extraction (Qwen3 sometimes outputs thinking tags).

### PDF Extraction (`src/lib/files/pdf-extractor.ts`)

Extracts **embedded images** directly from PDF — does NOT render pages. Uses pdfjs-dist operator list to find `paintImageXObject` ops, gets raw pixel data from page objects, converts to JPEG via sharp. No canvas dependency needed.

**Critical:** Worker source must be set as a module specifier (`"pdfjs-dist/legacy/build/pdf.worker.mjs"`), NOT a file path — Turbopack mangles `require.resolve` paths with `[project]` prefix, and `file://` URLs don't work on Vercel.

### PDF Generation (`src/lib/pdf/voucher-pdf.ts`)

Client-side jsPDF generating Cash Voucher PDFs.

- **Font loading:** NotoSans TTF fetched from `/public/fonts/`, converted to base64 using chunked 8KB subarrays (NOT `String.fromCharCode(...spread)` which causes stack overflow on large arrays). Base64 cached in module scope, registered on each new jsPDF doc instance.
- **With source image attached:** A4 portrait — voucher on top half, source receipt image on bottom half, same page.
- **Without source:** A5 landscape.
- Auth box width: `mx + cw - authBoxX - 2` (stretches to near right edge).
- Amount underline at `recdY + 3` to avoid collision with text.

### Key Components

- **VoucherPreview.tsx** — HTML/CSS replica of the Cash Voucher. Main box 580×340px. Bottom section uses flex-col: Auth by row at top, Recd amount centered in middle, Paid by grid + Signature at bottom.
- **VoucherCard.tsx** — Single voucher: editable form + live preview + source image.
- **VoucherList.tsx** — Header with batch actions: "Attach Source to All" toggle (only shows when vouchers have `sourceImageUrl`), "Download All PDFs", "Clear All".
- **FailedImages.tsx** — Shows failed OCR images with thumbnails, error messages, per-image retry, batch "Retry All".
- **PdfDownloadButton.tsx** — Print handler revokes Object URL via `afterprint` event + 5-min fallback timeout.

### State Management

- **useVoucherState** — reducer for voucher CRUD.
- **useOcrProcessing** — parallel OCR queue with atomic `nextIndex++` counter (NOT `queue.shift()` which races with concurrent workers). Exposes `ocrSingleImage` for retry.
- **useFileUpload** — file state management.

### Blank Vouchers

`createBlankVoucher()` in `page.tsx` creates vouchers from scratch (no OCR). "+ New Voucher" button in header, "Create Blank Voucher" on empty state.

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `VLLM_HOST` | RunPod vLLM endpoint URL |
| `VLLM_MODEL` | Model name (e.g. `Qwen/Qwen3-VL-8B-Instruct`) |
| `VLM_TIMEOUT_MS` | Qwen timeout before fallback (default 60000) |
| `OPENAI_API_KEY` | GPT-4o fallback |

## Known Issues & Fixes Applied

- **pdfjs-dist on Vercel:** `require.resolve` paths get mangled by Turbopack. Use module specifier string for `workerSrc`.
- **pdfjs canvas rendering:** pdfjs v5 + node-canvas `drawImage` incompatible for embedded images. Solution: extract images via operator list instead of rendering pages.
- **Qwen3 thinking mode:** Can output `<think>` blocks that break JSON parsing. Disabled via `enable_thinking: false` + stripping in parse-response.
- **Font stack overflow:** Large ArrayBuffer → base64 via spread crashes. Use chunked 8KB conversion.
- **OCR queue race:** Concurrent workers calling `queue.shift()` on shared array. Use atomic index counter.
- **Vercel timeouts:** Both API routes need `export const maxDuration = 60` and matching `vercel.json`.



claude --resume 01533e28-f1f4-41ac-9249-aae11d846922                                                                                                                                   