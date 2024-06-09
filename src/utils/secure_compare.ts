export const secureCompare = async (a: string, b: string) => {
  // よくわかってない、単純な比較より安全だろうという感覚

  const algorithm = 'hmac'

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const bufferA = encoder.encode(a)
  const bufferB = encoder.encode(b)

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode('secret'),
    { name: algorithm, hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const resultA = await crypto.subtle.sign(algorithm, key, bufferA)
  const hashA = decoder.decode(resultA)

  const resultB = await crypto.subtle.sign(algorithm, key, bufferB)
  const hashB = decoder.decode(resultB)

  return hashA === hashB
}
