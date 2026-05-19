// Gemini Flash client — native fetch (per CLAUDE.md rule "không dùng SDK").
// Handles:
//  - Multi-key rotation (GEMINI_API_KEY_1..N)
//  - Per-key daily quota tracking (in-memory, resets on cold start — best effort)
//  - Per-request retry with exponential backoff on 429/5xx
//  - Google Search grounding tool enabled
//
// Rate limits (free tier, VN region, verified 2026-05-19):
//   gemini-2.5-flash      : Free tier chỉ 20 RPD/key  (quá ít cho 10k dự án)
//   gemini-2.5-flash-lite : Free tier ~1000 RPD/key ✓ default choice
//   Override: set GEMINI_MODEL=gemini-2.5-flash trên Vercel env nếu mày paid Tier 1.

import type { GeminiBatchOutput } from './types'

const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite'
const ENDPOINT = (key: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`

/** Collect all GEMINI_API_KEY_* env vars. Fallback to GOOGLE_GEMINI_API_KEY / GEMINI_API_KEY singleton. */
function loadKeys(): string[] {
  const keys: string[] = []
  for (let i = 1; i <= 10; i++) {
    const v = process.env[`GEMINI_API_KEY_${i}`]
    if (v) keys.push(v)
  }
  const single = process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY
  if (single && !keys.includes(single)) keys.push(single)
  return keys
}

// Module-level rotation state (per Vercel function instance).
let _cursor = 0
const _usage = new Map<string, { count: number; lastReset: number }>()

// Default: 950 — leave headroom under flash-lite free tier 1000 RPD.
// For paid Tier 1 set GEMINI_RPD_PER_KEY=10000.
const DAILY_BUDGET_PER_KEY = Number(process.env.GEMINI_RPD_PER_KEY ?? 950)
const RESET_MS = 24 * 60 * 60 * 1000

function pickKey(): string | null {
  const keys = loadKeys()
  if (keys.length === 0) return null
  const now = Date.now()

  for (let attempt = 0; attempt < keys.length; attempt++) {
    const k = keys[(_cursor + attempt) % keys.length]
    const u = _usage.get(k) ?? { count: 0, lastReset: now }
    if (now - u.lastReset > RESET_MS) {
      u.count = 0
      u.lastReset = now
    }
    if (u.count < DAILY_BUDGET_PER_KEY) {
      u.count += 1
      _usage.set(k, u)
      _cursor = (_cursor + attempt + 1) % keys.length
      return k
    }
  }
  return null // all keys exhausted for today
}

export class GeminiQuotaExhaustedError extends Error {
  constructor() {
    super('All Gemini API keys have hit their daily quota')
    this.name = 'GeminiQuotaExhaustedError'
  }
}

export class GeminiAPIError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`Gemini API error ${status}: ${body.slice(0, 500)}`)
    this.name = 'GeminiAPIError'
    this.status = status
    this.body = body
  }
}

interface CallOptions {
  prompt: string
  /** Enable Google Search grounding. Default true. */
  grounding?: boolean
  /** Max retries on transient errors. Default 2. */
  maxRetries?: number
  /** Per-request timeout ms. Default 60_000. */
  timeoutMs?: number
}

interface GeminiRawResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>
    }
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>
    }
  }>
  error?: { code: number; message: string; status: string }
}

async function callOnce(key: string, opts: CallOptions): Promise<{ text: string; sources: string[] }> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? 60_000)

  const body: Record<string, unknown> = {
    contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topP: 0.9,
      // Batch 5 dự án × ~1.5k tokens output = ~7.5k. Bump to 32k để có headroom
      // tránh "Non-JSON output: ..." vì truncate. Flash-Lite supports up to 64k.
      maxOutputTokens: 32768,
    },
  }
  if (opts.grounding !== false) {
    body.tools = [{ google_search: {} }]
  }

  let res: Response
  try {
    res = await fetch(ENDPOINT(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    })
  } finally {
    clearTimeout(timer)
  }

  const raw = await res.text()
  if (!res.ok) throw new GeminiAPIError(res.status, raw)

  let parsed: GeminiRawResponse
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new GeminiAPIError(500, 'Invalid JSON from Gemini: ' + raw.slice(0, 300))
  }
  if (parsed.error) throw new GeminiAPIError(parsed.error.code ?? 500, parsed.error.message)

  const cand = parsed.candidates?.[0]
  const text = cand?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  const sources =
    cand?.groundingMetadata?.groundingChunks
      ?.map(c => c.web?.uri)
      .filter((u): u is string => Boolean(u)) ?? []

  return { text, sources }
}

/** Strip ```json ... ``` fences if model added them despite instructions. */
function stripFences(s: string): string {
  const m = s.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (m) return m[1].trim()
  return s.trim()
}

/**
 * Call Gemini Flash with key rotation + retry. Parses response as JSON
 * matching GeminiBatchOutput. Returns parsed object + sources from grounding.
 */
export async function callGeminiBatch(opts: CallOptions): Promise<{
  output: GeminiBatchOutput
  sources: string[]
  keyUsed: string
}> {
  const maxRetries = opts.maxRetries ?? 2

  let lastErr: unknown = null
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const key = pickKey()
    if (!key) throw new GeminiQuotaExhaustedError()

    try {
      const { text, sources } = await callOnce(key, opts)
      const cleaned = stripFences(text)
      let parsed: GeminiBatchOutput
      try {
        parsed = JSON.parse(cleaned)
      } catch (e) {
        throw new GeminiAPIError(500, `Non-JSON output: ${cleaned.slice(0, 500)}`)
      }
      if (!parsed || !Array.isArray(parsed.projects)) {
        throw new GeminiAPIError(500, 'Output missing "projects" array')
      }
      return { output: parsed, sources, keyUsed: maskKey(key) }
    } catch (err) {
      lastErr = err
      if (err instanceof GeminiAPIError) {
        // Retry on 429 (rate) and 5xx. Other 4xx = fatal.
        if (err.status !== 429 && err.status < 500) throw err
      }
      const wait = 600 * Math.pow(2, attempt) + Math.random() * 300
      await new Promise(r => setTimeout(r, wait))
    }
  }
  throw lastErr ?? new Error('callGeminiBatch failed without error')
}

function maskKey(k: string): string {
  if (k.length <= 8) return '***'
  return k.slice(0, 4) + '...' + k.slice(-4)
}

/** Telemetry for the cron endpoint. */
export function getQuotaUsage(): Array<{ key: string; count: number; lastReset: number }> {
  return Array.from(_usage.entries()).map(([k, v]) => ({
    key: maskKey(k),
    count: v.count,
    lastReset: v.lastReset,
  }))
}
