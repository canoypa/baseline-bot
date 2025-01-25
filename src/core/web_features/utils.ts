import { CDN_URL } from '../constants'
import { PACKAGE_NAME } from './constants'

export const buildPackageUrl = (version: string, path: string) =>
  new URL(`${PACKAGE_NAME}@${version}${path}`, CDN_URL)
