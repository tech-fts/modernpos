import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parse } from 'csv-parse'
import { extractTokenFromCookies } from '@/lib/secure-cookies'
import { generateBarcodeEan13, generateSku } from '@/lib/product-identifiers'

// POST /api/products/import - Import products from CSV
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

    console.log(`Processing ${records.length} products...`)

    let successCount = 0
    let errorCount = 0
    const errors: string[] = []

    // Process each record
    for (const record of records) {
      try {
        // Validate required fields
        if (!record.name || !record.price || !record.category_name) {
          errors.push(`Row ${successCount + errorCount + 1}: Missing required fields`)
          errorCount++
          continue
        }

        // Parse numeric fields
        const price = parseFloat(record.price)
        const cost = parseFloat(record.cost || '0')
        const stock = parseInt(record.stock || '0')

        if (isNaN(price) || price <= 0) {
          errors.push(`Row ${successCount + errorCount + 1}: Invalid price`)
          errorCount++
          continue
        }

        // Find category by name
        const category = await prisma.categories.findFirst({
          where: { 
            name: {
              equals: record.category_name,
              mode: 'insensitive'
            },
            user_id: userId
          }
        })

        if (!category) {
          errors.push(`Row ${successCount + errorCount + 1}: Category not found`)
          errorCount++
          continue
        }

        const providedSku = typeof record.sku === 'string' ? record.sku.trim() : ''
        let sku = providedSku || generateSku(record.name)
        for (let attempt = 0; attempt < 5; attempt++) {
          const existingSku = await prisma.products.findFirst({
            where: {
              sku,
              user_id: userId
            }
          })
          if (!existingSku) break
          sku = generateSku(record.name)
        }

        // Check if product already exists when SKU is provided
        const existingProduct = providedSku
          ? await prisma.products.findFirst({
              where: { 
                sku: providedSku,
                user_id: userId
              }
            })
          : null

        if (existingProduct) {
          // Update existing product
          await prisma.products.update({
            where: { id: existingProduct.id },
            data: {
              name: record.name,
              description: record.description || null,
              price: price,
              cost: cost,
              stock: stock,
              category_id: category.id
            }
          })
        } else {
          const barcode = generateBarcodeEan13()

          // Create new product
          await prisma.products.create({
            data: {
              id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: record.name,
              description: record.description || null,
              sku,
              barcode,
              price: price,
              cost: cost,
              stock: stock,
              category_id: category.id,
              user_id: userId, // Use authenticated user ID
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
    console.error('Error importing products:', error)
    return NextResponse.json(
      { error: 'Failed to import products' },
      { status: 500 }
    )
  }
}
