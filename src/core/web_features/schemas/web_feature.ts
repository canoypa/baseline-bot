import * as v from 'valibot'

const urlSchema = v.pipe(v.string(), v.url())

export const BrowserIdentifier = v.union([
  v.literal('chrome'),
  v.literal('chrome_android'),
  v.literal('edge'),
  v.literal('firefox'),
  v.literal('firefox_android'),
  v.literal('safari'),
  v.literal('safari_ios'),
])
export type BrowserIdentifier = v.InferInput<typeof BrowserIdentifier>

export const SupportBrowser = v.record(
  BrowserIdentifier,
  v.optional(v.string()),
)
export type SupportBrowser = v.InferInput<typeof SupportBrowser>

export const BaselineIdentifier = v.union([
  v.literal('high'),
  v.literal('low'),
  v.literal(false),
])
export type BaselineIdentifier = v.InferInput<typeof BaselineIdentifier>

export const Status = v.object({
  baseline: BaselineIdentifier,
  baseline_low_date: v.optional(v.string()),
  baseline_high_date: v.optional(v.string()),
  support: SupportBrowser,
})

export const SupportStatus = v.object({
  ...Status.entries,
  by_compat_key: v.optional(v.record(v.string(), Status)),
})
export type SupportStatus = v.InferInput<typeof SupportStatus>

export const WebFeatureData = v.object({
  name: v.string(),
  description: v.string(),
  description_html: v.string(),
  spec: v.union([urlSchema, v.array(urlSchema)]),
  group: v.optional(v.union([v.string(), v.array(v.string())])),
  snapshot: v.optional(v.union([v.string(), v.array(v.string())])),
  caniuse: v.optional(v.union([v.string(), v.array(v.string())])),
  status: SupportStatus,
  compat_features: v.optional(v.array(v.string())),
})
export type WebFeatureData = v.InferInput<typeof WebFeatureData>

export const WebFeatures = v.record(v.string(), WebFeatureData)
export type WebFeatures = v.InferInput<typeof WebFeatures>

export const WebFeaturesData = v.object({
  features: WebFeatures,
})
export type WebFeaturesData = v.InferInput<typeof WebFeaturesData>
