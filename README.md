# Gemini Nano Sandbox

Chrome 内蔵の Gemini Nano（[Prompt API](https://developer.chrome.com/docs/ai/prompt-api)）の応答を ChatGPT 風の UI で試すための個人検証アプリ。

## 必要環境

- **Chrome 138 以上**（macOS 13+ / Windows 10+ / Linux / 対応 ChromeOS）
- 22GB 以上の空きストレージ（モデルは初回のみ自動ダウンロード）
- GPU: 4GB VRAM 以上 / または CPU: 16GB RAM・4コア以上

`chrome://flags/` で以下を有効にする必要がある場合があります:

- `optimization-guide-on-device-model`
- `prompt-api-for-gemini-nano`

モデルのダウンロード状況は `chrome://components/` の「Optimization Guide On Device Model」で確認できます。

## 開発

```bash
pnpm install
pnpm dev
```

http://localhost:5173 を Chrome で開く。

## ビルド

```bash
pnpm build
pnpm preview
```

## 主な機能

- マルチターン対話（同一セッション内でコンテキストを保持）
- ストリーミング表示（Markdown / コードブロックのシンタックスハイライト対応）
- 応答の途中キャンセル
- System プロンプト / Temperature / Top-K の調整（次セッションから反映）
- モデル未対応・未ダウンロード時のステータス表示

## 技術スタック

- Vite + React 19 + TypeScript
- Tailwind CSS v4
- [Streamdown](https://streamdown.ai/)（ストリーミング Markdown レンダリング）
- Radix UI + lucide-react
- `@types/dom-chromium-ai`（`window.LanguageModel` の型定義）

## ライセンス

MIT
