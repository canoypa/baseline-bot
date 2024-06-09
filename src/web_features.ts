/**
 * @license https://github.com/web-platform-dx/web-features/blob/main/LICENSE.txt
 */

export type BaselineIdentifier = 'high' | 'low'

export type BrowserIdentifier =
  | 'chrome'
  | 'chrome_android'
  | 'edge'
  | 'firefox'
  | 'firefox_android'
  | 'safari'
  | 'safari_ios'

export type SupportBrowser = {
  [K in BrowserIdentifier]?: string
}

export type SupportStatus = {
  baseline: BaselineIdentifier | false
  baseline_low_date?: string
  baseline_high_date?: string
  support: SupportBrowser
}

export type WebFeature = {
  name: string
  description: string
  description_html: string
  status: SupportStatus

  spec: string | string[]
  alias?: string | string[]
  caniuse?: string | string[]
  compat_features?: string[]
  usage_stats?: string | string[]
}

export type WebFeatures = {
  [id: string]: WebFeature
}
