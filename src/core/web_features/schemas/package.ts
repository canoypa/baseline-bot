import * as v from 'valibot'

export const packageJsonSchema = v.object({
  version: v.string(),
})
export type PackageJson = v.InferInput<typeof packageJsonSchema>
