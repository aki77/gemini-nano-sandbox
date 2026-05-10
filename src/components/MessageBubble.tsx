import { Streamdown } from 'streamdown'
import { cn } from '@/lib/utils'
import type { ChatMessage } from '@/hooks/useLanguageModel'

interface Props {
  message: ChatMessage
  isStreaming: boolean
}

export function MessageBubble({ message, isStreaming }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      className={cn(
        'flex w-full gap-3 px-4 py-3',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900'
            : 'bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100',
        )}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {message.content.length === 0 && isStreaming ? (
              <span className="inline-block h-4 w-2 animate-pulse bg-neutral-400" />
            ) : (
              <Streamdown>{message.content}</Streamdown>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
