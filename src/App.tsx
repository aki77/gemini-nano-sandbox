import { useCallback, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { ChatPanel } from '@/components/ChatPanel'
import { Composer } from '@/components/Composer'
import { SettingsPanel } from '@/components/SettingsPanel'
import { useLanguageModel } from '@/hooks/useLanguageModel'
import { useConversations } from '@/hooks/useConversations'

function availabilityMessage(
  availability: ReturnType<typeof useLanguageModel>['availability'],
): string | null {
  switch (availability) {
    case 'unavailable':
      return 'このブラウザでは Gemini Nano Prompt API を利用できません。Chrome 138 以上 (対応OS) でアクセスし、必要なフラグを有効にしてください。'
    case 'downloadable':
      return 'モデル未ダウンロードです。プロンプトを送信すると初回ダウンロードが始まります（数百MB）。'
    case 'downloading':
      return 'モデルをダウンロード中です…'
    case 'checking':
      return '利用可否を確認中…'
    default:
      return null
  }
}

function App() {
  const lm = useLanguageModel()
  const convs = useConversations()

  useEffect(() => {
    if (lm.messages.length === 0 || lm.isStreaming) return
    const id = convs.saveConversation(
      convs.activeConversationId,
      lm.messages,
      lm.params,
    )
    convs.setActiveConversationId(id)
  }, [lm.messages, lm.isStreaming])

  const handleSelectConversation = useCallback(
    (id: string) => {
      const conv = convs.loadConversation(id)
      if (!conv) return
      lm.loadConversation(conv.messages, conv.params)
      convs.setActiveConversationId(id)
    },
    [convs, lm],
  )

  const handleDeleteConversation = useCallback(
    (id: string) => {
      convs.deleteConversation(id)
      if (convs.activeConversationId === id) {
        lm.resetSession()
        convs.setActiveConversationId(null)
      }
    },
    [convs, lm],
  )

  const handleReset = useCallback(() => {
    lm.resetSession()
    convs.setActiveConversationId(null)
  }, [lm, convs])

  const banner = availabilityMessage(lm.availability)
  const composerDisabled =
    lm.availability === 'unavailable' ||
    lm.availability === 'checking' ||
    lm.isPreparingSession

  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-neutral-950">
      <SettingsPanel
        params={lm.params}
        modelParams={lm.modelParams}
        isDirty={lm.isDirty}
        hasMessages={lm.messages.length > 0}
        disabled={lm.availability === 'unavailable'}
        onChange={lm.setParams}
        onReset={handleReset}
        conversations={convs.conversations}
        activeConversationId={convs.activeConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
      />
      <main className="flex min-w-0 flex-1 flex-col">
        {banner && (
          <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{banner}</p>
          </div>
        )}
        {lm.error && (
          <div className="flex items-start gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>{lm.error}</p>
          </div>
        )}
        {lm.isPreparingSession && (
          <div className="border-b border-neutral-200 bg-neutral-50 px-4 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            セッションを準備中…
            {lm.downloadProgress !== null && (
              <span className="ml-2 tabular-nums">
                {(lm.downloadProgress * 100).toFixed(1)}%
              </span>
            )}
          </div>
        )}
        <div className="min-h-0 flex-1">
          <ChatPanel messages={lm.messages} isStreaming={lm.isStreaming} />
        </div>
        <Composer
          disabled={composerDisabled}
          isStreaming={lm.isStreaming}
          onSend={lm.send}
          onStop={lm.stop}
        />
      </main>
    </div>
  )
}

export default App
