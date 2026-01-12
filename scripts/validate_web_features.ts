import { flatten, safeParse } from 'valibot'
import { WebFeatures } from '../src/core/web_features/schemas/web_feature'

const CDN_URL = 'https://www.unpkg.com'
const PACKAGE_NAME = 'web-features'

const buildPackageUrl = (version: string, path: string) =>
  `${CDN_URL}/${PACKAGE_NAME}@${version}${path}`

interface ValidationResult {
  success: boolean
  version: string
  timestamp: string
  errors?: any
}

async function main() {
  try {
    // 最新バージョン取得
    const pkgUrl = buildPackageUrl('next', '/package.json')
    const pkgRes = await fetch(pkgUrl)
    if (!pkgRes.ok) throw new Error('Failed to fetch package.json')
    const pkg = (await pkgRes.json()) as any
    const version = pkg.version

    // 最新データ取得
    const dataUrl = buildPackageUrl(version, '/data.json')
    const res = await fetch(dataUrl)
    if (!res.ok) throw new Error('Failed to fetch data.json')
    const json = await res.json()
    const result = safeParse(WebFeatures, json)

    const output: ValidationResult = {
      success: result.success,
      version,
      timestamp: new Date().toISOString(),
    }

    if (result.success) {
      console.log(JSON.stringify(output, null, 2))
    } else {
      const issues = result.issues
      const flat = flatten(issues)
      output.errors = flat
      console.log(JSON.stringify(output, null, 2))
      process.exit(1)
    }
  } catch (error) {
    const output: ValidationResult = {
      success: false,
      version: 'unknown',
      timestamp: new Date().toISOString(),
      errors: [
        { message: error instanceof Error ? error.message : String(error) },
      ],
    }
    console.log(JSON.stringify(output, null, 2))
    process.exit(1)
  }
}

main()
