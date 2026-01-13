import { CDN_URL } from '../constants'
import { PACKAGE_NAME } from './constants'

const normalizePath = (path: string) => {
  if (path.startsWith('/')) return path
  return `/${path}`
}

export const buildPackageUrl = (version: string, path: string) =>
  new URL(`${PACKAGE_NAME}@${version}${normalizePath(path)}`, CDN_URL)
