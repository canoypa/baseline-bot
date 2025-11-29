# copilot-instructions.md

## プロジェクト概要

- TypeScript で実装された Cloudflare Workers 用の Bot プロジェクトです。
- Misskey との連携、Webhook 処理、スケジュール実行などを行います。
- `src/` 以下に主要なロジックが配置されています。

### 主要機能: Baseline の更新検知

- Web Platform Baseline（web-featuresパッケージ由来）のデータ更新を定期的に検知し、主要ブラウザでのサポート状況やBaselineステータスの変化を自動で判定します。
- 変更が検知された場合、Misskeyへ自動で通知を投稿します。
- この処理は `src/services/scheduled.ts` で実装されています。

### 使用パッケージ

- `hono`: Cloudflare Workers 向けの軽量なWebフレームワーク。
- `fuse.js`: 検索・曖昧検索用のライブラリ。
- `valibot`: スキーマバリデーション用。
- `web-features`: Web Platform Baselineの公式データセット。
- `wrangler`: Cloudflare Workersの開発・デプロイ用CLI。

## コーディングガイドライン

- TypeScript の型安全性を重視してください。
- ES2020 以降の構文を推奨します。
- Cloudflare Workers の制約（ファイルシステム非対応、Node.js 標準モジュールの一部非対応など）に注意してください。
- 外部 API との通信は `fetch` を利用し、エラーハンドリングを必ず実装してください。
- Secrets や認証情報は直接コードに書かず、環境変数や `wrangler.toml` で管理してください。

## 命名規則

- 変数・関数名はキャメルケース（例: `fetchWithParse`）。
- 定数は全て大文字＋アンダースコア（例: `DEFAULT_TIMEOUT`）。
- ファイル名は**スネークケース**（例: `webhook_secret_middleware.ts`）で統一してください（自分が作成するもの）。

## テスト

- テストは `*.test.ts` ファイルに記述してください。
- Jest ではなく、Cloudflare Workers 互換のテストランナーを想定しています。

## PR・コミット

- 1 つの PR には 1 つの目的・機能追加/修正のみを含めてください。
- コミットメッセージは英語で、簡潔かつ内容が分かるように記述してください。

## その他

- Misskey API の仕様変更には注意し、互換性を保つようにしてください。
- `src/core/web_features/schemas/` 以下はスキーマ定義専用です。ロジックは他のファイルに記述してください。
