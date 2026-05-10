import { useCallback, useState } from 'react'
import type { ChatMessage, SessionParams } from '@/hooks/useLanguageModel'

export interface Conversation {
  id: string
  title: string
  messages: ChatMessage[]
  params: SessionParams
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = 'gemini-nano-conversations'
const MAX_CONVERSATIONS = 10

function createId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    'randomUUID' in globalThis.crypto
  ) {
    return globalThis.crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2)
}

function loadFromStorage(): Conversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Conversation[]
  } catch {
    return []
  }
}

function saveToStorage(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
  } catch (e) {
    console.warn('localStorage write failed:', e)
  }
}

function generateTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  return first?.content.slice(0, 20) ?? '新しい会話'
}

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>(
    loadFromStorage,
  )
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null)

  const saveConversation = useCallback(
    (
      id: string | null,
      messages: ChatMessage[],
      params: SessionParams,
    ): string => {
      const now = Date.now()
      let resultId = id ?? createId()

      setConversations((prev) => {
        const existing = id ? prev.find((c) => c.id === id) : null
        let next: Conversation[]

        if (existing) {
          next = prev.map((c) =>
            c.id === id
              ? { ...c, messages, params, updatedAt: now }
              : c,
          )
        } else {
          const newConv: Conversation = {
            id: resultId,
            title: generateTitle(messages),
            messages,
            params,
            createdAt: now,
            updatedAt: now,
          }
          next = [newConv, ...prev]
        }

        next = next
          .sort((a, b) => b.updatedAt - a.updatedAt)
          .slice(0, MAX_CONVERSATIONS)

        saveToStorage(next)
        return next
      })

      return resultId
    },
    [],
  )

  const loadConversation = useCallback(
    (id: string): Conversation | null => {
      return conversations.find((c) => c.id === id) ?? null
    },
    [conversations],
  )

  const deleteConversation = useCallback((id: string): void => {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

  return {
    conversations,
    activeConversationId,
    saveConversation,
    loadConversation,
    deleteConversation,
    setActiveConversationId,
  }
}
