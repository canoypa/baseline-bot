import type { WebFeatureData } from '../core/web_features/schemas/web_feature'
import type { Bindings } from '../env'
import type { UpdatedFeature } from './updated_feature'

/** KVに保存するRSS状態のキー */
export const RSS_STATE_KEY = 'rss:state'

/** RSSフィードに含める最小アイテム数（通常時に維持する履歴の目安） */
export const RSS_MIN_ITEMS = 25

/** 想定外の大量更新時の安全上限（システム負荷対策） */
export const RSS_HARD_MAX_ITEMS = 100

/** RSS 1アイテムのデータ構造 */
export type RssItem = {
  /** 一意なID (例: wf@1.0.0#feature-key) - RSSの<guid>に使用 */
  id: string
  /** web-featuresパッケージのバージョン */
  packageVersion: string
  /** web-features内のfeature識別子 */
  featureKey: string
  /** RSSアイテムのタイトル（機能名） */
  title: string
  /** RSSアイテムの説明文（Misskey投稿と同じ内容） */
  description: string
  /** RFC 1123形式の公開日時 */
  pubDate: string
}

/** KVに保存するRSS状態の全体構造 */
export type RssState = {
  /** スキーマバージョン（将来の拡張用） */
  schemaVersion: 1
  /** 最終更新日時（ISO8601形式） */
  lastUpdatedAt: string
  /** RSS <lastBuildDate>用のRFC 1123形式日時 */
  lastBuildDate: string
  /** HARD_MAX到達時の元のアイテム数（省略情報として記録） */
  truncatedOriginalCount?: number
  /** RSSアイテムのリスト（新しい順） */
  items: RssItem[]
}

/**
 * DateオブジェクトをRFC 1123形式の文字列に変換
 * RSS 2.0の<pubDate>や<lastBuildDate>で使用
 */
export const getRfc1123Date = (date: Date) => date.toUTCString()

/**
 * XML特殊文字をエスケープ
 * RSS XMLへ文字列を注入する際に必須（XSS/XML破損防止）
 */
export const escapeXml = (value: string) => {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

/**
 * RSS状態からETagを算出
 * 内容が同じなら同じETagを返すことで、304 Not Modified対応を実現
 */
export const computeRssEtag = (state: RssState) => {
  const firstId = state.items[0]?.id ?? 'empty'
  return `W/\"v1:${state.lastUpdatedAt}:${state.items.length}:${firstId}\"`
}

/**
 * UpdatedFeatureから1つのRssItemを生成
 * id は「wf@<version>#<featureKey>」形式で安定性を確保（重複排除に使用）
 */
export const buildRssItemFromFeature = (
  updated: UpdatedFeature,
  packageVersion: string,
  pubDate: string,
  description: string,
): RssItem => {
  return {
    id: `wf@${packageVersion}#${updated.featureKey}`,
    packageVersion,
    featureKey: updated.featureKey,
    title: updated.feature.name,
    description,
    pubDate,
  }
}

/**
 * 当日の更新アイテムと既存のRSS状態をマージしてローリング保存
 *
 * ロジック:
 * - 当日のアイテムが25件以上 → 当日分で上書き（最大100件まで）
 * - 当日のアイテムが25件未満 → 既存から重複排除して合計25件になるよう埋める
 *
 * これにより「最低25件を維持」かつ「当日25件超なら全件保持」を実現
 */
export const mergeRssItems = (
  oldState: RssState | null,
  todayItems: RssItem[],
): RssState => {
  const now = new Date()

  // 当日アイテム内で重複排除
  const dedupToday = dedupeItems(todayItems)

  // 当日が25件以上：当日分で上書き（想定外の大量更新時はHARD_MAXで制限）
  if (dedupToday.length >= RSS_MIN_ITEMS) {
    const capped = dedupToday.slice(0, RSS_HARD_MAX_ITEMS)
    return {
      schemaVersion: 1,
      lastUpdatedAt: now.toISOString(),
      lastBuildDate: getRfc1123Date(now),
      truncatedOriginalCount:
        dedupToday.length > RSS_HARD_MAX_ITEMS ? dedupToday.length : undefined,
      items: capped,
    }
  }

  // 当日が25件未満：既存から重複を除外して合計25件になるよう埋める
  const oldItems = oldState?.items ?? []
  const todayIds = new Set(dedupToday.map((i) => i.id))
  const carry = oldItems.filter((i) => !todayIds.has(i.id))

  const merged = [...dedupToday, ...carry].slice(0, RSS_MIN_ITEMS)

  return {
    schemaVersion: 1,
    lastUpdatedAt: now.toISOString(),
    lastBuildDate: getRfc1123Date(now),
    items: merged,
  }
}

/**
 * アイテムリストからidで重複排除（順序を保持、最初の出現を優先）
 */
const dedupeItems = (items: RssItem[]) => {
  const seen = new Set<string>()
  const result: RssItem[] = []

  for (const item of items) {
    if (seen.has(item.id)) continue
    seen.add(item.id)
    result.push(item)
  }

  return result
}

/**
 * RSS 2.0形式のXML文字列を生成
 *
 * 注意点:
 * - <item><link> は出力しない（spec/caniuseは<description>に含まれている）
 * - チャンネルの<link>はリクエストURLのoriginを使用
 * - 全てのテキストはescapeXmlでエスケープ
 */
export const renderRssXml = (options: {
  state: RssState | null
  requestUrl: string
  channelTitle?: string
  channelDescription?: string
}) => {
  const url = new URL(options.requestUrl)
  const channelLink = url.origin
  const channelTitle = options.channelTitle ?? 'baseline-bot'
  const channelDescription =
    options.channelDescription ??
    'Detected updates from web-features Baseline data.'

  const state =
    options.state ??
    ({
      schemaVersion: 1,
      lastUpdatedAt: new Date(0).toISOString(),
      lastBuildDate: getRfc1123Date(new Date(0)),
      items: [],
    } satisfies RssState)

  const itemsXml = state.items
    .map((item) => {
      return [
        '<item>',
        `<title>${escapeXml(item.title)}</title>`,
        `<description>${escapeXml(item.description)}</description>`,
        `<guid isPermaLink="false">${escapeXml(item.id)}</guid>`,
        `<pubDate>${escapeXml(item.pubDate)}</pubDate>`,
        '</item>',
      ].join('')
    })
    .join('')

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0">',
    '<channel>',
    `<title>${escapeXml(channelTitle)}</title>`,
    `<link>${escapeXml(channelLink)}</link>`,
    `<description>${escapeXml(channelDescription)}</description>`,
    `<lastBuildDate>${escapeXml(state.lastBuildDate)}</lastBuildDate>`,
    itemsXml,
    '</channel>',
    '</rss>',
  ].join('')
}

/**
 * KVからRSS状態を読み込み
 * @returns 保存済み状態、または未保存の場合はnull
 */
export const loadRssState = async (env: Bindings): Promise<RssState | null> => {
  const state = await env.KV.get(RSS_STATE_KEY, 'json')
  if (!state) return null
  return state as RssState
}

/**
 * RSS状態をKVへ保存
 */
export const saveRssState = async (env: Bindings, state: RssState) => {
  await env.KV.put(RSS_STATE_KEY, JSON.stringify(state))
}

/**
 * Misskey投稿用のnoteContentをRSSのdescriptionに変換
 * （現状は同じ内容をそのまま使用）
 */
export const toRssDescriptionFromNoteContent = (noteContent: string) => {
  // Keep content identical to Misskey notification, but RSS expects a single string.
  return noteContent
}

/**
 * 更新検知結果のリストから、RSS用のアイテムリストを生成
 * scheduled実行時に呼ばれ、Misskey通知と同じ内容をRSSにも反映する
 */
export const buildRssItemsForUpdates = (args: {
  updates: UpdatedFeature[]
  packageVersion: string
  now: Date
  getNoteContent: (feature: WebFeatureData) => string
}) => {
  const pubDate = getRfc1123Date(args.now)
  return args.updates.map((updated) => {
    const noteContent = args.getNoteContent(updated.feature)
    const description = toRssDescriptionFromNoteContent(noteContent)
    return buildRssItemFromFeature(
      updated,
      args.packageVersion,
      pubDate,
      description,
    )
  })
}
