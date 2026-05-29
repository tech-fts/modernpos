import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating products
const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  cost: z.number().positive('Cost must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category_id: z.string().min(1, 'Category is required')
})

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('PUT /api/products/[id] - Request body:', body)
    console.log('PUT /api/products/[id] - Product ID:', id)
    
    // Validate input
    const validatedData = updateProductSchema.parse(body)
    console.log('PUT /api/products/[id] - Validated data:', validatedData)
    
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if SKU is being changed and if the new SKU already exists
    if (validatedData.sku !== existingProduct.sku) {
      const skuExists = await prisma.products.findUnique({
        where: { sku: validatedData.sku }
      })
      
      if (skuExists) {
        return NextResponse.json(
          { error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    // Check if category exists
    const category = await prisma.categories.findUnique({
      where: { id: validatedData.category_id }
    })
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Update product
    const updatedProduct = await prisma.products.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description,
        sku: validatedData.sku,
        barcode: validatedData.barcode,
        price: validatedData.price,
        cost: validatedData.cost,
        stock: validatedData.stock,
        category_id: validatedData.category_id
      },
      include: {
        categories: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('PUT /api/products/[id] - Validation error:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id }
    })
    
    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if product is used in any sales
    const salesCount = await prisma.sale_items.count({
      where: {
        product_id: id
      }
    })
    
    if (salesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product that has sales history. Please archive the product instead.' },
        { status: 400 }
      )
    }

    // Delete product
    await prisma.products.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
