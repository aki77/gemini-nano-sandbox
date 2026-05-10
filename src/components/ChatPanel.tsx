import { useEffect, useRef } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from '@/components/MessageBubble'
import type { ChatMessage } from '@/hooks/useLanguageModel'

interface Props {
  messages: ChatMessage[]
  isStreaming: boolean
}

export function ChatPanel({ messages, isStreaming }: Props) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center px-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
        <div>
          <p className="mb-2 text-base font-medium text-neutral-700 dark:text-neutral-200">
            Gemini Nano Sandbox
          </p>
          <p>
            プロンプトを入力すると、Chrome 内蔵の Gemini Nano からストリーミングで応答が返ります。
          </p>
        </div>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="mx-auto flex max-w-3xl flex-col py-4">
        {messages.map((message, idx) => (
          <MessageBubble
            key={message.id}
            message={message}
            isStreaming={isStreaming && idx === messages.length - 1}
          />
        ))}
        <div ref={bottomRef} />
      </div>
    </ScrollArea>
  )
}
