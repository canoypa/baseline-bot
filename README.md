# baseline-bot

```
npm install
npm run dev
```

```
npm run deploy
```

## Misskey への配信

`createNote()` は `MISSKEY_DELIVER === "true"` のときだけ実際に投稿し、それ以外は本文をログに出す。

この目印は `wrangler.toml` の `[env.production.vars]` にしか無い。vars は環境間で継承されないので、`wrangler dev` には現れない。

- **本番**: `npm run deploy`（`wrangler deploy --env production`）で目印が付く。素の `wrangler deploy` を手打ちすると目印が付かず bot が黙る。
- **ローカルで実配信を確認したいとき**: `.dev.vars` に `MISSKEY_DELIVER=true` と実 token を入れる。終わったら消す。

## 環境変数

ローカルは `.dev.vars.example` を `.dev.vars` にコピーする。

| キー | 置き場所 |
| --- | --- |
| `MISSKEY_TOKEN` | 本番 secret（`wrangler secret put`） |
| `MISSKEY_WEBHOOK_SECRET` | 本番 secret。`POST /webhook/mentioned` の `X-Misskey-Hook-Secret` と照合する |
| `MISSKEY_DELIVER` | `wrangler.toml` の `[env.production.vars]` |
