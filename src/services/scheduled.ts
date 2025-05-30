import { packageJsonSchema } from '../core/web_features/schemas/package'
import {
  type BaselineIdentifier,
  type BrowserIdentifier,
  type SupportBrowser,
  type WebFeatureData,
  type WebFeatures,
  WebFeaturesData,
} from '../core/web_features/schemas/web_feature'
import { buildPackageUrl } from '../core/web_features/utils'
import type { Bindings } from '../env'
import { fetchWithParse } from '../utils/fetch_with_parse'

export type KvStore = {
  baseline: BaselineIdentifier | false
  support: BrowserIdentifier[]
}

export const getUpdatedFeatures = (
  previousFeatures: WebFeatures,
  latestFeatures: WebFeatures,
) => {
  const result: WebFeatureData[] = []

  for (const key in latestFeatures) {
    const latest = latestFeatures[key]
    const previous = previousFeatures[key]

    // New feature
    if (!previous) {
      // 登録時点で widely available なら通知しない
      if (latest.status.baseline !== 'high') {
        result.push(latest)
      }

      continue
    }

    // Baseline status changed
    if (latest.status.baseline !== previous.status.baseline) {
      result.push(latest)
      continue
    }

    // Browser support changed
    if (
      new Set(Object.keys(latest.status.support)).difference(
        new Set(Object.keys(previous.status.support)),
      ).size > 0
    ) {
      result.push(latest)
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
  let content = `${feature.name}\n\n`.replaceAll('@(.+)', '@\u{200B}$1')

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

  content += `----\n${feature.description}\n\n`.replaceAll(
    '@(.+)',
    '@\u{200B}$1',
  )

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

const notify = async (features: WebFeatureData[], env: Bindings) => {
  for (const feature of features) {
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

export const scheduledTask = async (
  _controller: ScheduledController,
  env: Bindings,
  _c: ExecutionContext,
) => {
  const nextPackageJson = await fetchWithParse(
    packageJsonSchema,
    buildPackageUrl('next', 'package.json'),
  )
  const nextFeaturesVersion = nextPackageJson.version

  const previousFeaturesVersion =
    (await env.KV.get('previousVersion')) ?? nextFeaturesVersion

  if (previousFeaturesVersion === nextFeaturesVersion) {
    return
  }

  const previousFeatures = await fetchWithParse(
    WebFeaturesData,
    buildPackageUrl(previousFeaturesVersion, '/data.json'),
  )
  const latestFeatures = await fetchWithParse(
    WebFeaturesData,
    buildPackageUrl(nextFeaturesVersion, '/data.json'),
  )

  await env.KV.put('previousVersion', nextFeaturesVersion)

  const updatedFeatures = getUpdatedFeatures(
    previousFeatures.features,
    latestFeatures.features,
  )
  console.log(updatedFeatures)

  await notify(updatedFeatures, env)
}
