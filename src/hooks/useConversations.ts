import { useCallback, useState } from 'react'
import type { AttachmentBase, ChatMessage, SessionParams } from '@/hooks/useLanguageModel'
import { createId } from '@/lib/utils'

export type PersistedAttachment = AttachmentBase

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

type PersistedMessage = Omit<ChatMessage, 'attachments'> & { attachments?: PersistedAttachment[] }

function stripAttachmentBlobs(messages: ChatMessage[]): PersistedMessage[] {
  return messages.map((msg) => {
    if (!msg.attachments?.length) return msg
    return {
      ...msg,
      attachments: msg.attachments.map(({ id, kind, name, mimeType }) => ({
        id,
        kind,
        name,
        mimeType,
      })),
    }
  })
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
    const serializable = conversations.map((c) => ({
      ...c,
      messages: stripAttachmentBlobs(c.messages),
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.warn('localStorage write failed:', e)
  }
}

function generateTitle(messages: ChatMessage[]): string {
  const first = messages.find((m) => m.role === 'user')
  if (!first) return '新しい会話'
  if (first.content) return first.content.slice(0, 20)
  if (first.attachments?.[0]) {
    const kind = first.attachments[0].kind === 'image' ? '画像' : '音声'
    return `${kind}メッセージ`
  }
  return '新しい会話'
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
      const resultId = id ?? createId()

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
