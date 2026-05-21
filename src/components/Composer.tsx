import { useEffect, useRef, useState } from 'react'
import { Mic, Paperclip, Send, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { createId } from '@/lib/utils'
import type { Attachment } from '@/hooks/useLanguageModel'

interface Props {
  disabled: boolean
  isStreaming: boolean
  onSend: (text: string, attachments?: Attachment[]) => void
  onStop: () => void
}

export function Composer({ disabled, isStreaming, onSend, onStop }: Props) {
  const [value, setValue] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingError, setRecordingError] = useState<string | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const attachmentsRef = useRef(attachments)

  useEffect(() => {
    attachmentsRef.current = attachments
  }, [attachments])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`
  }, [value])

  useEffect(() => {
    return () => {
      for (const a of attachmentsRef.current) URL.revokeObjectURL(a.previewUrl)
      mediaRecorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const newAttachments: Attachment[] = []
    for (const file of Array.from(files)) {
      const kind = file.type.startsWith('image/') ? 'image' : 'audio'
      newAttachments.push({
        id: createId(),
        kind,
        blob: file,
        name: file.name,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      })
    }
    setAttachments((prev) => [...prev, ...newAttachments])
  }

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const target = prev.find((a) => a.id === id)
      if (target) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }

  const handleSubmit = () => {
    const trimmed = value.trim()
    if ((!trimmed && attachments.length === 0) || disabled || isStreaming) return
    onSend(trimmed, attachments.length ? attachments : undefined)
    setValue('')
    setAttachments([])
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = ''
  }

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }

    setRecordingError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const attachment: Attachment = {
          id: createId(),
          kind: 'audio',
          blob,
          name: `録音_${new Date().toLocaleTimeString('ja-JP')}.webm`,
          mimeType: 'audio/webm',
          previewUrl: URL.createObjectURL(blob),
        }
        setAttachments((prev) => [...prev, attachment])
        setIsRecording(false)
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }

      recorder.onerror = () => {
        stream.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        setIsRecording(false)
        setRecordingError('録音中にエラーが発生しました')
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setIsRecording(true)
    } catch {
      setRecordingError('マイクへのアクセスが拒否されました')
    }
  }

  const canSend = (value.trim().length > 0 || attachments.length > 0) && !disabled && !isStreaming

  return (
    <div className="border-t border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950">
      {attachments.length > 0 && (
        <div className="mb-2 flex gap-2 overflow-x-auto pb-1">
          {attachments.map((a) => (
            <div
              key={a.id}
              className="relative shrink-0 rounded-lg border border-neutral-200 bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900"
            >
              {a.kind === 'image' ? (
                <img
                  src={a.previewUrl}
                  alt={a.name}
                  className="h-20 w-20 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-20 w-40 flex-col items-center justify-center gap-1 px-2">
                  <audio controls src={a.previewUrl} className="w-full scale-75" />
                  <span className="max-w-full truncate text-xs text-neutral-500">{a.name}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(a.id)}
                aria-label={`${a.name} を削除`}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-neutral-800 text-white hover:bg-neutral-600 dark:bg-neutral-200 dark:text-neutral-900"
              >
                <X className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {recordingError && (
        <p role="alert" className="mb-2 text-xs text-red-500">
          {recordingError}
        </p>
      )}

      <div aria-live="polite" className="sr-only">
        {isRecording ? '録音中' : ''}
      </div>

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,audio/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
          aria-label="ファイルを選択"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
          aria-label="ファイルを添付"
          className="min-h-12 min-w-12 shrink-0"
        >
          <Paperclip className="size-4" />
        </Button>

        <Button
          type="button"
          variant={isRecording ? 'destructive' : 'ghost'}
          size="icon"
          disabled={disabled}
          onClick={toggleRecording}
          aria-label={isRecording ? '録音を停止' : 'マイクで録音'}
          className="min-h-12 min-w-12 shrink-0"
        >
          {isRecording ? <Square className="size-4" /> : <Mic className="size-4" />}
        </Button>

        <Textarea
          ref={textareaRef}
          rows={1}
          value={value}
          placeholder={
            disabled
              ? 'Gemini Nano が利用できません'
              : 'プロンプトを入力 (Cmd/Ctrl+Enter で送信)'
          }
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-11 resize-none"
        />

        {isStreaming ? (
          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={onStop}
            aria-label="停止"
            className="min-h-12 min-w-12 shrink-0"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            disabled={!canSend}
            onClick={handleSubmit}
            aria-label="送信"
            className="min-h-12 min-w-12 shrink-0"
          >
            <Send className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
