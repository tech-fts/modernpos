const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testSales() {
  try {
    console.log('Testing database connection...')
    
    // Check total sales count
    const totalSales = await prisma.sale.count()
    console.log(`Total sales in database: ${totalSales}`)
    
    if (totalSales > 0) {
      // Get first few sales
      const sales = await prisma.sale.findMany({
        take: 5,
        include: {
          items: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
      
      console.log('\nFirst 5 sales:')
      sales.forEach((sale, index) => {
        console.log(`${index + 1}. Sale ID: ${sale.id}`)
        console.log(`   Total: ${sale.total}`)
        console.log(`   Date: ${sale.createdAt}`)
        console.log(`   Items: ${sale.items.length}`)
        console.log('')
      })
    }
    
    // Check today's sales
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const todaySales = await prisma.sale.count({
      where: {
        createdAt: {
          gte: today
        }
      }
    })
    
    console.log(`Sales today: ${todaySales}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testSales()
