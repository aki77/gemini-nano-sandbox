# Gemini Nano Sandbox

Chrome内蔵のGemini Nano（Prompt API）をChatGPT風UIで試す個人検証アプリ。

## Commands

```bash
pnpm dev      # 開発サーバー起動
pnpm build    # tsc -b && vite build
pnpm lint     # ESLint
pnpm preview  # ビルド済みをプレビュー
```

## Architecture

```
src/
  App.tsx                  ルートコンポーネント
  hooks/
    useLanguageModel.ts    Gemini Nano APIとのやり取り・状態管理
    useConversations.ts    会話履歴のlocalStorage永続化
  lib/
    language-model.ts      LanguageModel APIラッパー
  components/
    ChatPanel.tsx          メッセージ一覧
    Composer.tsx           メッセージ入力
    MessageBubble.tsx      メッセージ単体（Markdown対応）
    SettingsPanel.tsx      会話リスト + パラメータ設定サイドバー
    ui/                    Radix UIベースの汎用コンポーネント
```

## Gotchas

- **Chrome専用API**: `LanguageModel` はChrome 138以上でのみ利用可能。開発はChrome必須
- **型制約**: `@types/dom-chromium-ai` の `initialPrompts` 型は厳密。`LanguageModelSystemMessage` と `LanguageModelMessage[]` を別々に組み立てて結合する必要がある（`LanguageModelPrompt[]` は使えない）
- **`@` エイリアス**: `@/` は `src/` を指す（vite.config.ts で設定済み）
- **会話履歴**: localStorageキー `gemini-nano-conversations`、最大10件、updatedAt降順

## Code Style

- コメントは原則書かない（自明でない場合のみ）
- `pnpm` を使用（npm/yarn は使わない）
