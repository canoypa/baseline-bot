import Fuse from 'fuse.js'
import {
  WebFeatures,
  type WebFeatureData,
} from '../core/web_features/schemas/web_feature'
import { fetchWithParse } from '../utils/fetch_with_parse'

export const searchFeature = async (query: string) => {
  const features = await fetchWithParse(
    WebFeatures,
    'https://www.unpkg.com/web-features@latest/data.json',
  )

  const featureList = Object.values(features.features).filter(
    (feature): feature is WebFeatureData => feature.kind === 'feature',
  )

  const fuse = new Fuse(featureList, {
    keys: ['name', 'description'],
    includeScore: true,
  })

  const results = fuse.search(query)

  if (results.length === 0) {
    return null
  }

  return results[0].item
}
