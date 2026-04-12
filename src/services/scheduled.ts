import { packageJsonSchema } from '../core/web_features/schemas/package'
import {
  type BaselineIdentifier,
  type BrowserIdentifier,
  type Features,
  type SupportBrowser,
  type WebFeatureData,
  WebFeatures,
} from '../core/web_features/schemas/web_feature'
import { buildPackageUrl } from '../core/web_features/utils'
import type { Bindings } from '../env'
import { fetchWithParse } from '../utils/fetch_with_parse'
import {
  buildRssItemsForUpdates,
  loadRssState,
  mergeRssItems,
  saveRssState,
} from './rss'
import type { UpdatedFeature } from './updated_feature'

export type KvStore = {
  baseline: BaselineIdentifier | false
  support: BrowserIdentifier[]
}

export const getUpdatedFeatures = (
  previousFeatures: Features,
  latestFeatures: Features,
) => {
  const result: UpdatedFeature[] = []

  for (const key in latestFeatures) {
    const latest = latestFeatures[key]
    const previous = previousFeatures[key]

    // moved/split は現状スキップ（kind: 'feature' のみ処理）
    if (latest.kind !== 'feature') {
      continue
    }

    // New feature
    if (!previous) {
      // 登録時点で widely available なら通知しない
      if (latest.status.baseline !== 'high') {
        result.push({ featureKey: key, feature: latest })
      }

      continue
    }

    // previous が feature でない場合はスキップ
    if (previous.kind !== 'feature') {
      continue
    }

    // Baseline status changed
    if (latest.status.baseline !== previous.status.baseline) {
      result.push({ featureKey: key, feature: latest })
      continue
    }

    // Browser support changed
    if (
      new Set(Object.keys(latest.status.support)).difference(
        new Set(Object.keys(previous.status.support)),
      ).size > 0
    ) {
      result.push({ featureKey: key, feature: latest })
      continue
    }
  }

  return result
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

export const getNoteContent = (feature: WebFeatureData) => {
  let content = `${feature.name}\n\n`.replaceAll('@', '@\u{2060}')

  if (feature.status.baseline === 'high') {
    content += `✅ Widely available!\n`
  }

  if (feature.status.baseline === 'low') {
    content += `☑️ Newly available!\n`
  }

  if (feature.status.baseline === false) {
    const emoji = (status: boolean) => {
      return status ? '✅' : '❌'
    }

    content += `⚠️ Limited availability!\n`

    const support = getBrowserSupports(feature.status.support)

    content += `Chrome ${emoji(support.chrome)} / `
    content += `Edge ${emoji(support.edge)} / `
    content += `Firefox ${emoji(support.firefox)} / `
    content += `Safari ${emoji(support.safari)}\n`
  }

  content += `----\n${feature.description}\n\n`.replaceAll('@', '@\u{2060}')

  if (feature.caniuse) {
    content += `caniuse: https://caniuse.com/${feature.caniuse}\n`
  }

  if (typeof feature.spec === 'string') {
    content += `spec: ${feature.spec}`
  } else {
    content += feature.spec.reduce((acc, s) => `${acc}\n    - ${s}`, 'spec:')
  }

  return content
}

const notify = async (features: UpdatedFeature[], env: Bindings) => {
  for (const { feature } of features) {
    await fetch('https://misskey.io/api/notes/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.MISSKEY_TOKEN}`,
      },
      body: JSON.stringify({
        visibility: 'home',
        text: getNoteContent(feature),
        noExtractMentions: true,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to create note: ${res.statusText}`)
        return res.json()
      })
      .then((data) => {
        console.log(data)
      })
      .catch((e) => {
        console.error(e)
      })

    // 負荷にならないように1秒待つ
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

/**
 * 定期実行タスク（wrangler.tomlのcronで1日1回実行）
 *
 * 処理フロー:
 * 1. 更新検知: web-featuresの最新バージョンと前回バージョンを比較
 * 2. RSS履歴更新: 検知した更新をKVのrss:stateに追記（Misskey成功/失敗と独立）
 * 3. Misskey投稿: 各機能について1件ずつ投稿
 * 4. バージョン前進: finally で previousVersion を更新（RSS/Misskey失敗でも実行）
 */
export const scheduledTask = async (
  _controller: ScheduledController,
  env: Bindings,
  _c: ExecutionContext,
) => {
  // 最新バージョンを取得
  const nextPackageJson = await fetchWithParse(
    packageJsonSchema,
    buildPackageUrl('next', '/package.json'),
  )
  const nextFeaturesVersion = nextPackageJson.version

  // 前回処理済みバージョンを取得
  const previousFeaturesVersion =
    (await env.KV.get('previousVersion')) ?? nextFeaturesVersion

  // バージョンが変わっていなければスキップ
  if (previousFeaturesVersion === nextFeaturesVersion) {
    return
  }

  // 前回と最新のdata.jsonを取得して差分を検知
  const previousFeatures = await fetchWithParse(
    WebFeatures,
    buildPackageUrl(previousFeaturesVersion, '/data.json'),
  )
  const latestFeatures = await fetchWithParse(
    WebFeatures,
    buildPackageUrl(nextFeaturesVersion, '/data.json'),
  )

  const updatedFeatures = getUpdatedFeatures(
    previousFeatures.features,
    latestFeatures.features,
  )

  try {
    if (updatedFeatures.length > 0) {
      // RSS履歴を更新（Misskey投稿とは独立して実行）
      try {
        const oldState = await loadRssState(env)
        const todayItems = buildRssItemsForUpdates({
          updates: updatedFeatures,
          packageVersion: nextFeaturesVersion,
          now: new Date(),
          getNoteContent,
        })
        const newState = mergeRssItems(oldState, todayItems)
        await saveRssState(env, newState)
      } catch (e) {
        console.error('Failed to update RSS state', e)
      }

      // Misskey投稿（RSS更新とは独立して実行）
      try {
        await notify(updatedFeatures, env)
      } catch (e) {
        console.error('Failed to notify Misskey', e)
      }
    }
  } finally {
    // RSS/Misskey成功/失敗に関わらず、このバージョンを「処理済み」として記録
    // （再実行防止と処理前進のため）
    await env.KV.put('previousVersion', nextFeaturesVersion).catch((e) => {
      console.error('Failed to update previousVersion', e)
    })
  }
}
