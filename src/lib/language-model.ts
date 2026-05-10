export type AvailabilityStatus =
  | 'unavailable'
  | 'downloadable'
  | 'downloading'
  | 'available'

export interface SessionOptions {
  systemPrompt?: string
  temperature?: number
  topK?: number
  onDownloadProgress?: (loaded: number) => void
  signal?: AbortSignal
}

export function isLanguageModelSupported(): boolean {
  return typeof globalThis !== 'undefined' && 'LanguageModel' in globalThis
}

export async function checkAvailability(): Promise<AvailabilityStatus> {
  if (!isLanguageModelSupported()) {
    return 'unavailable'
  }
  try {
    return await LanguageModel.availability()
  } catch {
    return 'unavailable'
  }
}

export interface ResolvedParams {
  defaultTemperature: number
  maxTemperature: number
  defaultTopK: number
  maxTopK: number
}

const FALLBACK_PARAMS: ResolvedParams = {
  defaultTemperature: 1,
  maxTemperature: 2,
  defaultTopK: 3,
  maxTopK: 8,
}

export async function getParams(): Promise<ResolvedParams> {
  if (!isLanguageModelSupported()) return FALLBACK_PARAMS
  try {
    const params = await LanguageModel.params()
    return {
      defaultTemperature: params.defaultTemperature,
      maxTemperature: params.maxTemperature,
      defaultTopK: params.defaultTopK,
      maxTopK: params.maxTopK,
    }
  } catch {
    return FALLBACK_PARAMS
  }
}

export async function createSession(
  options: SessionOptions = {},
): Promise<LanguageModel> {
  if (!isLanguageModelSupported()) {
    throw new Error('LanguageModel API is not available in this browser.')
  }

  const { systemPrompt, temperature, topK, onDownloadProgress, signal } =
    options

  const createOptions: LanguageModelCreateOptions = { signal }

  if (systemPrompt && systemPrompt.trim().length > 0) {
    createOptions.initialPrompts = [
      { role: 'system', content: systemPrompt },
    ]
  }

  if (typeof temperature === 'number') {
    createOptions.temperature = temperature
  }
  if (typeof topK === 'number') {
    createOptions.topK = topK
  }

  if (onDownloadProgress) {
    createOptions.monitor = (m) => {
      m.addEventListener('downloadprogress', (event) => {
        onDownloadProgress(event.loaded)
      })
    }
  }

  return await LanguageModel.create(createOptions)
}

export interface StreamCallbacks {
  onDelta: (delta: string, fullText: string) => void
  signal?: AbortSignal
}

export async function streamPrompt(
  session: LanguageModel,
  input: string,
  { onDelta, signal }: StreamCallbacks,
): Promise<string> {
  const stream = session.promptStreaming(input, { signal })
  const reader = stream.getReader()
  let fullText = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value === undefined) continue
      // Spec: chunks are deltas. Defensive: if a chunk looks like the cumulative
      // text (starts with what we already have and is longer), treat it as a
      // replacement instead of an append.
      if (value.startsWith(fullText) && value.length > fullText.length) {
        const delta = value.slice(fullText.length)
        fullText = value
        onDelta(delta, fullText)
      } else {
        fullText += value
        onDelta(value, fullText)
      }
    }
  } finally {
    reader.releaseLock()
  }
  return fullText
}
