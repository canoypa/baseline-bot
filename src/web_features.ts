import type { features } from 'web-features'

export type WebFeatures = typeof features

export type WebFeature = WebFeatures[string]

export type SupportStatus = WebFeature['status']

export type BaselineIdentifier = Exclude<SupportStatus['baseline'], false>

export type SupportBrowser = SupportStatus['support']

export type BrowserIdentifier = keyof SupportStatus['support']
