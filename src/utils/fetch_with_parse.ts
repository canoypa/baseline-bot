import * as v from 'valibot'

export const fetchWithParse = async <T extends v.BaseSchema<any, any, any>>(
  schema: T,
  input: RequestInfo,
  init?: RequestInit,
) => {
  const response = await fetch(input, init)
  const contentType = response.headers.get('content-type') ?? ''
  const clone = response.clone()

  if (!response.ok) {
    const snippet = (await clone.text()).slice(0, 200)
    throw new Error(
      `Failed to fetch JSON (${response.status} ${response.statusText}) content-type=${contentType} body=${JSON.stringify(snippet)}`,
    )
  }

  const json: unknown = await response.json().catch(async () => {
    const snippet = (await clone.text()).slice(0, 200)
    throw new Error(
      `Invalid JSON response content-type=${contentType} body=${JSON.stringify(snippet)}`,
    )
  })

  return v.parse(schema, json)
}
