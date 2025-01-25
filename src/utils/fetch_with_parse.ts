import * as v from 'valibot'

export const fetchWithParse = async <T extends v.BaseSchema<any, any, any>>(
  schema: T,
  input: RequestInfo,
  init?: RequestInit,
) => {
  const response = await fetch(input, init).then((r) => r.json())
  return v.parse(schema, response)
}
