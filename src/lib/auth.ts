import bcrypt from 'bcryptjs'
import { prisma } from './db'

export interface JWTPayload {
  userId: string
  email: string
  role: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function generateToken(payload: JWTPayload): Promise<string> {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  console.log('🔑 Generating token with secret: SECRET_EXISTS')
  console.log('📦 Token payload:', { userId: payload.userId, role: payload.role })
  
  // Import the Edge-compatible JWT generation
  const { generateTokenEdge } = await import('./jwt-edge')
  const token = await generateTokenEdge(payload, secret)
  console.log('✅ Generated token:', token.substring(0, 20) + '...')
  return token
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      console.error('❌ JWT_SECRET environment variable is not set')
      return null
    }
    console.log('Verifying token with secret: SECRET_EXISTS')
    console.log('Token to verify:', token.substring(0, 20) + '...')
    
    // Import the Edge-compatible JWT verification
    const { verifyTokenEdge } = await import('./jwt-edge')
    const decoded = await verifyTokenEdge(token, secret)
    console.log('Token verified successfully:', decoded)
    return decoded
  } catch (error) {
    console.error('JWT verification failed:', error)
    return null
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    console.log('🔍 Attempting to authenticate user:', email)
    
    const user = await prisma.users.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ User not found in database')
      return null
    }

    console.log('✅ User found:', { id: user.id, role: user.role })
    console.log('🔐 Password verification in progress...')

    const isValid = await verifyPassword(password, user.password)
    if (!isValid) {
      console.log('❌ Password verification failed')
      return null
    }

    console.log('✅ Authentication successful')
    return {
      id: user.id,
      email: user.email,
      role: user.role
    }
  } catch (error) {
    console.error('❌ Authentication error:', error)
    return null
  }
}
