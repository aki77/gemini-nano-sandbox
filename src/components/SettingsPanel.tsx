import { RotateCcw, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import type { ResolvedParams } from '@/lib/language-model'
import type { SessionParams } from '@/hooks/useLanguageModel'
import type { Conversation } from '@/hooks/useConversations'
import { cn } from '@/lib/utils'

interface Props {
  params: SessionParams
  modelParams: ResolvedParams | null
  isDirty: boolean
  hasMessages: boolean
  disabled: boolean
  onChange: (next: Partial<SessionParams>) => void
  onReset: () => void
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onDeleteConversation: (id: string) => void
}

export function SettingsPanel({
  params,
  modelParams,
  isDirty,
  hasMessages,
  disabled,
  onChange,
  onReset,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
}: Props) {
  const maxTemperature = modelParams?.maxTemperature ?? 2
  const maxTopK = modelParams?.maxTopK ?? 8

  return (
    <aside className="flex h-full w-80 flex-col border-r border-neutral-200 bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-4 pb-2">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
          過去の会話
        </h2>
        {conversations.length === 0 && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500">
            まだ会話がありません
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            className={cn(
              'group flex items-center gap-1 rounded-lg',
              conv.id === activeConversationId
                ? 'bg-neutral-200 dark:bg-neutral-700'
                : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
            )}
          >
            <button
              type="button"
              onClick={() => onSelectConversation(conv.id)}
              className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm text-neutral-800 dark:text-neutral-200"
            >
              {conv.title}
            </button>
            <button
              type="button"
              onClick={() => onDeleteConversation(conv.id)}
              className="mr-1 shrink-0 rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100 dark:text-neutral-500 dark:hover:text-red-400"
              aria-label="削除"
            >
              <Trash2 className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-5 border-t border-neutral-200 p-4 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            設定
          </h2>
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            変更は「新しい会話」を押すと次のセッションから反映されます。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="system-prompt">System プロンプト</Label>
          <Textarea
            id="system-prompt"
            rows={5}
            placeholder="例: あなたは丁寧な日本語アシスタントです。"
            value={params.systemPrompt}
            disabled={disabled}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="temperature">Temperature</Label>
            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
              {params.temperature.toFixed(2)}
            </span>
          </div>
          <Slider
            id="temperature"
            min={0}
            max={maxTemperature}
            step={0.05}
            value={[params.temperature]}
            disabled={disabled}
            onValueChange={([v]) => onChange({ temperature: v })}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="topk">Top-K</Label>
            <span className="text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
              {params.topK}
            </span>
          </div>
          <Slider
            id="topk"
            min={1}
            max={maxTopK}
            step={1}
            value={[params.topK]}
            disabled={disabled}
            onValueChange={([v]) => onChange({ topK: v })}
          />
        </div>

        <div className="space-y-2">
          {isDirty && hasMessages && (
            <p className="text-xs text-amber-600 dark:text-amber-400">
              パラメータが変更されています。「新しい会話」で反映されます。
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={onReset}
            disabled={!hasMessages && !isDirty}
          >
            <RotateCcw className="size-4" />
            新しい会話
          </Button>
        </div>
      </div>
    </aside>
  )
}
