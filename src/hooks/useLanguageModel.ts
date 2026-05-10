import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AvailabilityStatus,
  type ResolvedParams,
  checkAvailability,
  createSession,
  getParams,
  streamPrompt,
} from '@/lib/language-model'

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
}

export interface SessionParams {
  temperature: number
  topK: number
  systemPrompt: string
}

export interface UseLanguageModelState {
  availability: AvailabilityStatus | 'checking'
  modelParams: ResolvedParams | null
  messages: ChatMessage[]
  params: SessionParams
  isStreaming: boolean
  isPreparingSession: boolean
  downloadProgress: number | null
  error: string | null
  isDirty: boolean
}

export interface UseLanguageModelActions {
  send: (text: string) => Promise<void>
  stop: () => void
  resetSession: () => void
  setParams: (next: Partial<SessionParams>) => void
}

const DEFAULT_SYSTEM_PROMPT = ''

function createId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    'randomUUID' in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

export function useLanguageModel(): UseLanguageModelState &
  UseLanguageModelActions {
  const [availability, setAvailability] = useState<
    AvailabilityStatus | 'checking'
  >('checking')
  const [modelParams, setModelParams] = useState<ResolvedParams | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [params, setParamsState] = useState<SessionParams>({
    temperature: 1,
    topK: 3,
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
  })
  const [isStreaming, setIsStreaming] = useState(false)
  const [isPreparingSession, setIsPreparingSession] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const sessionRef = useRef<LanguageModel | null>(null)
  const sessionParamsRef = useRef<SessionParams | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    let cancelled = false
    const init = async () => {
      const status = await checkAvailability()
      if (cancelled) return
      setAvailability(status)
      if (status !== 'unavailable') {
        const resolved = await getParams()
        if (cancelled) return
        setModelParams(resolved)
        setParamsState((prev) => ({
          ...prev,
          temperature: resolved.defaultTemperature,
          topK: resolved.defaultTopK,
        }))
      }
    }
    init().catch((e) => {
      if (cancelled) return
      setError(e instanceof Error ? e.message : String(e))
    })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      sessionRef.current?.destroy()
      sessionRef.current = null
    }
  }, [])

  const ensureSession = useCallback(
    async (current: SessionParams): Promise<LanguageModel> => {
      const existing = sessionRef.current
      const lastParams = sessionParamsRef.current
      const sameParams =
        lastParams !== null &&
        lastParams.temperature === current.temperature &&
        lastParams.topK === current.topK &&
        lastParams.systemPrompt === current.systemPrompt

      if (existing && sameParams) return existing

      if (existing) {
        try {
          existing.destroy()
        } catch {
          // ignore
        }
        sessionRef.current = null
      }

      setIsPreparingSession(true)
      setDownloadProgress(null)
      try {
        const session = await createSession({
          systemPrompt: current.systemPrompt,
          temperature: current.temperature,
          topK: current.topK,
          onDownloadProgress: (loaded) => setDownloadProgress(loaded),
        })
        sessionRef.current = session
        sessionParamsRef.current = { ...current }
        return session
      } finally {
        setIsPreparingSession(false)
        setDownloadProgress(null)
      }
    },
    [],
  )

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed) return
      if (isStreaming || isPreparingSession) return

      setError(null)
      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
      }
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
      }
      setMessages((prev) => [...prev, userMessage, assistantMessage])

      const controller = new AbortController()
      abortRef.current = controller

      try {
        const session = await ensureSession(params)
        setIsDirty(false)
        setIsStreaming(true)
        await streamPrompt(session, trimmed, {
          signal: controller.signal,
          onDelta: (_delta, full) => {
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last && last.id === assistantMessage.id) {
                next[next.length - 1] = { ...last, content: full }
              }
              return next
            })
          },
        })
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') {
          // Cancelled by user — keep partial output
        } else {
          const message = e instanceof Error ? e.message : String(e)
          setError(message)
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.id === assistantMessage.id && !last.content) {
              return next.slice(0, -1)
            }
            return next
          })
        }
      } finally {
        setIsStreaming(false)
        abortRef.current = null
      }
    },
    [ensureSession, isPreparingSession, isStreaming, params],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const resetSession = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    if (sessionRef.current) {
      try {
        sessionRef.current.destroy()
      } catch {
        // ignore
      }
      sessionRef.current = null
    }
    sessionParamsRef.current = null
    setMessages([])
    setError(null)
    setIsDirty(false)
  }, [])

  const setParams = useCallback((next: Partial<SessionParams>) => {
    setParamsState((prev) => {
      const merged = { ...prev, ...next }
      const last = sessionParamsRef.current
      if (last) {
        const changed =
          last.temperature !== merged.temperature ||
          last.topK !== merged.topK ||
          last.systemPrompt !== merged.systemPrompt
        setIsDirty(changed)
      }
      return merged
    })
  }, [])

  return {
    availability,
    modelParams,
    messages,
    params,
    isStreaming,
    isPreparingSession,
    downloadProgress,
    error,
    isDirty,
    send,
    stop,
    resetSession,
    setParams,
  }
}
