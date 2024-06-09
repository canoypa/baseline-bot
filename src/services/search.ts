import Fuse from 'fuse.js'
import { fetchWebFeatures } from '../web_features'

export const searchFeature = async (query: string) => {
  const features = await fetchWebFeatures()

  const fuse = new Fuse(Object.values(features), {
    keys: ['name', 'description'],
    includeScore: true,
  })

  const results = fuse.search(query)

  if (results.length === 0) {
    return null
  }

  return results[0].item
}
