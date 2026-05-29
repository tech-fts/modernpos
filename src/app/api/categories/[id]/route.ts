import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updating categories
const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required')
})

// GET /api/categories/[id] - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    })

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    
    console.log('PUT /api/categories/[id] - Request body:', body)
    console.log('PUT /api/categories/[id] - Category ID:', id)
    
    // Validate input
    const validatedData = updateCategorySchema.parse(body)
    console.log('PUT /api/categories/[id] - Validated data:', validatedData)
    
    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if name is being changed and if the new name already exists
    if (validatedData.name !== existingCategory.name) {
      const nameExists = await prisma.categories.findUnique({
        where: { name: validatedData.name }
      })
      
      if (nameExists) {
        return NextResponse.json(
          { error: 'Category name already exists' },
          { status: 400 }
        )
      }
    }

    // Update category
    const updatedCategory = await prisma.categories.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(updatedCategory)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('PUT /api/categories/[id] - Validation error:', error.issues)
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if category exists
    const existingCategory = await prisma.categories.findUnique({
      where: { id }
    })
    
    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category is used in any products
    const products = await prisma.products.findMany({
      where: { category_id: id }
    })
    
    if (products.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has products. Please reassign or delete the products first.' },
        { status: 400 }
      )
    }

    // Delete category
    await prisma.categories.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
