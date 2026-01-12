import * as v from 'valibot'

type WFWebFeatures = typeof import('web-features')
type WFFeatures = WFWebFeatures['features']
type WFFeatureData = Extract<WFFeatures[string], { kind: 'feature' }>
type WFFeatureMovedData = Extract<WFFeatures[string], { kind: 'moved' }>
type WFFeatureSplitData = Extract<WFFeatures[string], { kind: 'split' }>
type WFStatusHeadline = WFFeatureData['status']
type WFBaselineIdentifier = WFStatusHeadline['baseline']
type WFSupportBrowser = WFStatusHeadline['support']
type WFBrowserIdentifier = keyof WFStatusHeadline['support']

type Assert<T extends true> = T

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
type _assertBrowserIdentifier = Assert<
  WFBrowserIdentifier extends v.InferInput<typeof BrowserIdentifier>
    ? true
    : false
>

export const SupportBrowser = v.record(
  BrowserIdentifier,
  v.optional(v.string()),
)
export type SupportBrowser = v.InferInput<typeof SupportBrowser>
type _assertSupportBrowser = Assert<
  WFSupportBrowser extends v.InferInput<typeof SupportBrowser> ? true : false
>

export const BaselineIdentifier = v.union([
  v.literal('high'), // Widely available
  v.literal('low'), // Newly available
  v.literal(false), // Baseline ではない
  v.literal(true), // 型定義上存在するが、どういう意味なのか謎。v3.9.3 現在は該当する値はないので無視する。
])
export type BaselineIdentifier = v.InferInput<typeof BaselineIdentifier>
type _assertBaselineIdentifier = Assert<
  WFBaselineIdentifier extends v.InferInput<typeof BaselineIdentifier>
    ? true
    : false
>

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
type _assertSupportStatus = Assert<
  WFStatusHeadline extends v.InferInput<typeof SupportStatus> ? true : false
>

export const WebFeatureData = v.object({
  kind: v.literal('feature'),
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
type _assertWebFeature = Assert<
  WFFeatureData extends v.InferInput<typeof WebFeatureData> ? true : false
>

export const WebFeatureMovedData = v.object({
  kind: v.literal('moved'),
  redirect_target: v.string(),
})
export type WebFeatureMovedData = v.InferInput<typeof WebFeatureMovedData>
type _assertWebFeatureMoved = Assert<
  WFFeatureMovedData extends v.InferInput<typeof WebFeatureMovedData>
    ? true
    : false
>

export const WebFeatureSplitData = v.object({
  kind: v.literal('split'),
  redirect_targets: v.array(v.string()),
})
export type WebFeatureSplitData = v.InferInput<typeof WebFeatureSplitData>
type _assertWebFeatureSplit = Assert<
  WFFeatureSplitData extends v.InferInput<typeof WebFeatureSplitData>
    ? true
    : false
>

export const Features = v.record(
  v.string(),
  v.union([WebFeatureData, WebFeatureMovedData, WebFeatureSplitData]),
)
export type Features = v.InferInput<typeof Features>
type _assertWebFeatures = Assert<
  WFFeatures extends v.InferInput<typeof Features> ? true : false
>

export const WebFeatures = v.object({
  features: Features,
})
export type WebFeatures = v.InferInput<typeof WebFeatures>
type _assertWebFeaturesData = Assert<
  WFWebFeatures extends v.InferInput<typeof WebFeatures> ? true : false
>
