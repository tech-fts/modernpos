import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parse } from 'csv-parse'
import { extractTokenFromCookies } from '@/lib/secure-cookies'

// POST /api/categories/import - Import categories from CSV
export async function POST(request: NextRequest) {
  try {
    // Get user info from token first
    const authToken = extractTokenFromCookies(request)
    if (!authToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Import and verify token
    const { verifyToken } = await import('@/lib/auth')
    const decoded = await verifyToken(authToken)
    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    const userId = decoded.userId
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'File must be a CSV' },
        { status: 400 }
      )
    }

    // Read and parse CSV
    const text = await file.text()
    const records = await new Promise((resolve, reject) => {
      parse(text, {
        columns: true,
        skip_empty_lines: true,
        trim: true
      }, (err, records) => {
        if (err) reject(err)
        else resolve(records)
      })
    })

    if (!Array.isArray(records) || records.length === 0) {
      return NextResponse.json(
        { error: 'No valid records found in CSV' },
        { status: 400 }
      )
    }

    console.log(`Processing ${records.length} categories...`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each record
    for (const record of records) {
      try {
        // Validate required fields
        if (!record.name) {
          errors.push(`Row ${successCount + errorCount + 1}: Missing category name`)
          errorCount++
          continue
        }

        // Check if category already exists for this user
        const existingCategory = await prisma.categories.findFirst({
          where: { 
            name: record.name,
            user_id: userId
          }
        })

        if (existingCategory) {
          // Update existing category
          await prisma.categories.update({
            where: { id: existingCategory.id },
            data: {
              description: record.description || null,
              updated_at: new Date()
            }
          })
        } else {
          // Create new category
          await prisma.categories.create({
            data: {
              id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: record.name,
              description: record.description || null,
              user_id: userId,
              created_at: new Date(),
              updated_at: new Date()
            }
          })
        }

        successCount++
      } catch (error) {
        console.error('Error processing record:', record, error)
        errors.push(`Row ${successCount + errorCount + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        errorCount++
      }
    }

    return NextResponse.json({
      message: 'Import completed',
      summary: {
        total: records.length,
        success: successCount,
        errors: errorCount
      },
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Error importing categories:', error)
    return NextResponse.json(
      { error: 'Failed to import categories' },
      { status: 500 }
    )
  }
}
