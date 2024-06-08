import { APIClient } from 'misskey-js/api.js'
import type { Bindings } from '../env'
import { arrayDifference } from '../utils/array_difference'
import {
  type BaselineIdentifier,
  type BrowserIdentifier,
  type SupportBrowser,
  type SupportStatus,
  type WebFeature,
  fetchWebFeatures,
} from '../web_features'

export type KvStore = {
  baseline: BaselineIdentifier | false
  support: BrowserIdentifier[]
}

export const isStatusChanged = (prev: KvStore, current: SupportStatus) => {
  return (
    prev.baseline !== current.baseline ||
    arrayDifference(Object.keys(current.support), prev.support).length > 0
  )
}

export const getBrowserSupports = (support: SupportBrowser) => {
  // サポートの判定にはモバイルアプリを含む
  return {
    chrome: 'chrome' in support && 'chrome_android' in support,
    edge: 'edge' in support,
    firefox: 'firefox' in support && 'firefox_android' in support,
    safari: 'safari' in support && 'safari_ios' in support,
  }
}

export const getNoteContent = (feature: WebFeature) => {
  if (feature.status.baseline === 'high') {
    const content = `✅ Widely available!

${feature.name}
----
${feature.description}
`

    return content
  }

  if (feature.status.baseline === 'low') {
    const content = `☑️ Newly available!

${feature.name}
----
${feature.description}
`

    return content
  }

  const support = getBrowserSupports(feature.status.support)

  const emoji = (status: boolean) => {
    return status ? '✅' : '❌'
  }

  const content = `⚠️ Limited availability!
Chrome ${emoji(support.chrome)} / Edge ${emoji(
    support.edge,
  )} / Firefox ${emoji(support.firefox)} / Safari ${emoji(support.safari)}

${feature.name}
----
${feature.description}
`

  return content
}

export const scheduledTask = async (
  _controller: ScheduledController,
  env: Bindings,
  _c: ExecutionContext,
) => {
  const features = await fetchWebFeatures()

  const kvList = await env.KV.list()
  const previous = Object.fromEntries(
    await Promise.all(
      kvList.keys.map(async (key) => {
        const value = await env.KV.get<KvStore>(key.name, 'json')
        if (!value) throw new Error('kv value is not found')
        return [key.name, value]
      }),
    ),
  ) as Record<string, KvStore>

  // 通知処理
  for (const key in features) {
    const feature = features[key]
    const prev = previous[key]

    if (
      // 以前から high のもの、新規のものは通知しない、以前の値がないことで確認
      !prev ||
      // ステータスが変わっていないものは通知しない
      !isStatusChanged(prev, feature.status)
    ) {
      continue
    }

    const noteContent = getNoteContent(feature)

    const misskey = new APIClient({
      origin: 'misskey.io',
      credential: env.MISSKEY_TOKEN,
    })
    misskey.request('notes/create', {
      visibility: 'specified',
      text: noteContent,
    })
  }

  // 次回更新検出用に kv を更新する
  for (const key in features) {
    const feature = features[key]

    // high のものは削除する
    if (feature.status.baseline === 'high') {
      const prev = previous[key]

      if (!prev) {
        continue
      }

      await env.KV.delete(key)
    }

    const value: KvStore = {
      baseline: feature.status.baseline,
      support: Object.keys(feature.status.support) as BrowserIdentifier[],
    }

    await env.KV.put(key, JSON.stringify(value))
  }
}
