import { RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Textarea } from '@/components/ui/textarea'
import type { ResolvedParams } from '@/lib/language-model'
import type { SessionParams } from '@/hooks/useLanguageModel'

interface Props {
  params: SessionParams
  modelParams: ResolvedParams | null
  isDirty: boolean
  hasMessages: boolean
  disabled: boolean
  onChange: (next: Partial<SessionParams>) => void
  onReset: () => void
}

export function SettingsPanel({
  params,
  modelParams,
  isDirty,
  hasMessages,
  disabled,
  onChange,
  onReset,
}: Props) {
  const maxTemperature = modelParams?.maxTemperature ?? 2
  const maxTopK = modelParams?.maxTopK ?? 8

  return (
    <aside className="flex h-full w-80 flex-col gap-5 border-r border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
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

      <div className="mt-auto space-y-2">
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
    </aside>
  )
}
