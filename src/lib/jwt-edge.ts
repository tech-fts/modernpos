// JWT implementation for Edge Runtime using Web Crypto API
export interface JWTPayload {
  userId: string
  email: string
  role: string
}

// Convert string to Uint8Array
function stringToUint8Array(str: string): Uint8Array {
  const bytes = new Uint8Array(str.length)
  for (let i = 0; i < str.length; i++) {
    bytes[i] = str.charCodeAt(i)
  }
  return bytes
}

// Convert Uint8Array to string
function uint8ArrayToString(arr: Uint8Array): string {
  return new TextDecoder().decode(arr)
}

// Base64 URL safe encoding
function base64UrlEncode(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

// Base64 URL safe decoding
function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, '+').replace(/_/g, '/')
  while (str.length % 4) str += '='
  const binary = atob(str)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// Generate HMAC-SHA256 signature
async function hmacSha256(message: string, secret: string): Promise<ArrayBuffer> {
  try {
    const secretBytes = stringToUint8Array(secret)
    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes as BufferSource,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    return await crypto.subtle.sign('HMAC', key, stringToUint8Array(message) as BufferSource)
  } catch (error) {
    console.error('HMAC-SHA256 generation error:', error)
    throw error
  }
}

// Generate JWT token
export async function generateTokenEdge(payload: JWTPayload, secret: string): Promise<string> {
  try {
    const header = { alg: 'HS256', typ: 'JWT' }
    const now = Math.floor(Date.now() / 1000)
    const claims = {
      ...payload,
      iat: now,
      exp: now + (7 * 24 * 60 * 60) // 7 days
    }

    const headerBase64 = base64UrlEncode(stringToUint8Array(JSON.stringify(header)))
    const payloadBase64 = base64UrlEncode(stringToUint8Array(JSON.stringify(claims)))
    
    const message = `${headerBase64}.${payloadBase64}`
    const signature = await hmacSha256(message, secret)
    const signatureBase64 = base64UrlEncode(signature)
    
    const finalToken = `${message}.${signatureBase64}`
    return finalToken
  } catch (error) {
    console.error('Token generation error:', error)
    throw error
  }
}

// Verify JWT token
export async function verifyTokenEdge(token: string, secret: string): Promise<JWTPayload | null> {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      console.log('Invalid token format: wrong number of parts')
      return null
    }

    const [headerBase64, payloadBase64, signature] = parts
    const message = `${headerBase64}.${payloadBase64}`
    
    // Generate expected signature
    const expectedSignature = await hmacSha256(message, secret)
    const expectedSignatureBase64 = base64UrlEncode(expectedSignature)
    
    // Compare signatures
    if (signature !== expectedSignatureBase64) {
      console.log('Signature mismatch during token verification')
      return null
    }

    // Decode payload
    const payloadBytes = base64UrlDecode(payloadBase64)
    const payloadStr = uint8ArrayToString(payloadBytes)
    const payload = JSON.parse(payloadStr)

    // Check expiration
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      console.log('Token expired')
      return null
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    }
  } catch (error) {
    console.error('JWT verification error:', error)
    return null
  }
}
