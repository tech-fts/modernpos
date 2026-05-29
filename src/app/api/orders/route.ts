import { NextRequest, NextResponse } from 'next/server'
import { apiRateLimiter } from '@/lib/security'
import { authenticateRequest } from '@/lib/api-helpers'

export async function GET(request: NextRequest) {
  // Admin/managers only
  const auth = await authenticateRequest(request)
  if (!auth.success || !auth.user) {
    return auth.response ?? NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json(
    { error: 'Orders API is not implemented for this database schema' },
    { status: 501 }
  )
}

export async function POST(request: NextRequest) {
  // Rate limit public order creation
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'anonymous'
  if (!apiRateLimiter.isAllowed(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  return NextResponse.json(
    { error: 'Orders API is not implemented for this database schema' },
    { status: 501 }
  )
}
