import type { WebFeatureData } from '../core/web_features/schemas/web_feature'

/**
 * 更新検知された機能の情報
 *
 * getUpdatedFeaturesの戻り値として使用し、
 * featureKeyを保持することでRSSのguid生成やMisskey投稿で参照可能にする
 */
export type UpdatedFeature = {
  /** web-features内のfeature識別キー（data.jsonのキー） */
  featureKey: string
  /** 機能の詳細データ */
  feature: WebFeatureData
}
