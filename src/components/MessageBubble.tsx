import { Streamdown } from 'streamdown'
import { cn } from '@/lib/utils'
import type { AttachmentBase, Attachment, ChatMessage } from '@/hooks/useLanguageModel'

interface Props {
  message: ChatMessage
  isStreaming: boolean
}

function isLiveAttachment(a: AttachmentBase): a is Attachment {
  return 'previewUrl' in a
}

function AttachmentList({ attachments }: { attachments: AttachmentBase[] }) {
  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {attachments.map((a) => {
        const previewUrl = isLiveAttachment(a) ? a.previewUrl : undefined
        if (a.kind === 'image') {
          return previewUrl ? (
            <img
              key={a.id}
              src={previewUrl}
              alt={a.name}
              className="max-h-48 max-w-full rounded-lg object-contain"
            />
          ) : (
            <div
              key={a.id}
              className="flex h-16 w-40 items-center justify-center rounded-lg bg-neutral-700 text-xs text-neutral-300 dark:bg-neutral-600"
            >
              [{a.name}（再ロード不可）]
            </div>
          )
        }
        return previewUrl ? (
          <div key={a.id} className="flex w-full flex-col gap-1">
            <audio controls src={previewUrl} className="max-w-xs" />
            <span className="text-xs opacity-70">{a.name}</span>
          </div>
        ) : (
          <div key={a.id} className="text-xs opacity-70">
            [{a.name}（再ロード不可）]
          </div>
        )
      })}
    </div>
  )
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
          <div>
            {message.attachments && message.attachments.length > 0 && (
              <AttachmentList attachments={message.attachments} />
            )}
            {message.content && (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>
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
