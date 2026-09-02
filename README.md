# baseline-bot

```
npm install
npm run dev
```

```
npm run deploy
```

## 環境変数

`MISSKEY_TOKEN` / `MISSKEY_WEBHOOK_SECRET` は本番の資格情報。**`wrangler secret put` で設定し、`.dev.vars` には実値を入れない**（`wrangler dev` が自動ロードするため、実トークンがあるとローカル実行から `@baseline_bot` として投稿できてしまう）。

ローカルは `.dev.vars.example` を `.dev.vars` にコピーし、必要なパスを触るときだけダミー値を入れる。
