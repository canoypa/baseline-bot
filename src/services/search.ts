import Fuse from 'fuse.js'
import { type WebFeatures } from '../web_features'

export const searchFeature = async (query: string) => {
  const features = await fetch(
    'https://www.unpkg.com/web-features@latest/index.json',
  ).then((r) => r.json() as Promise<{ features: WebFeatures }>)

  const fuse = new Fuse(Object.values(features.features), {
    keys: ['name', 'description'],
    includeScore: true,
  })

  const results = fuse.search(query)

  if (results.length === 0) {
    return null
  }

  return results[0].item
}
