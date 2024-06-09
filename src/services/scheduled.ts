import type { Bindings } from '../env'
import { arrayDifference } from '../utils/array_difference'
import {
  type BaselineIdentifier,
  type BrowserIdentifier,
  type SupportBrowser,
  type WebFeature,
  type WebFeatures,
} from '../web_features'

export type KvStore = {
  baseline: BaselineIdentifier | false
  support: BrowserIdentifier[]
}

export const getUpdatedFeatures = (
  previousFeatures: WebFeatures,
  latestFeatures: WebFeatures,
) => {
  const result: WebFeature[] = []

  for (const key in latestFeatures) {
    const latest = latestFeatures[key]
    const previous = previousFeatures[key]

    // New feature
    if (!previous) {
      result.push(latest)
      continue
    }

    // Baseline status changed
    if (latest.status.baseline !== previous.status.baseline) {
      result.push(latest)
      continue
    }

    // Browser support changed
    if (
      arrayDifference(
        Object.keys(latest.status.support),
        Object.keys(previous.status.support),
      ).length > 0
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

const notify = async (features: WebFeature[], env: Bindings) => {
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
  }
}

export const scheduledTask = async (
  _controller: ScheduledController,
  env: Bindings,
  _c: ExecutionContext,
) => {
  const previousFeaturesVersion = await env.KV.get('previousVersion')

  const latestPackage = await fetch(
    'https://www.unpkg.com/web-features@latest/package.json',
  ).then((r) => r.json() as Promise<{ version: string }>)
  const latestFeaturesVersion = latestPackage.version

  const previousFeatures = await fetch(
    `https://www.unpkg.com/web-features@${previousFeaturesVersion}/index.json`,
  ).then((r) => r.json() as Promise<WebFeatures>)

  const latestFeatures = await fetch(
    `https://www.unpkg.com/web-features@${latestFeaturesVersion}/index.json`,
  ).then((r) => r.json() as Promise<WebFeatures>)

  const updatedFeatures = getUpdatedFeatures(previousFeatures, latestFeatures)

  await notify(updatedFeatures, env)

  await env.KV.put('previousVersion', latestFeaturesVersion)
}
