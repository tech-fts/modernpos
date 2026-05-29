const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUserData() {
  try {
    console.log('🔍 Checking user data ownership...')
    
    const userId = 'user_1756475015260_hosgo61cz'
    
    // Check what data this user owns
    console.log('\n📊 Checking data ownership for user:', userId)
    
    // Check categories
    const userCategories = await prisma.categories.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, user_id: true }
    })
    console.log(`📁 Categories owned by user: ${userCategories.length}`)
    userCategories.forEach(cat => console.log(`   - ${cat.name} (ID: ${cat.id})`))
    
    // Check products
    const userProducts = await prisma.products.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, user_id: true }
    })
    console.log(`📦 Products owned by user: ${userProducts.length}`)
    userProducts.forEach(prod => console.log(`   - ${prod.name} (ID: ${prod.id})`))
    
    // Check customers
    const userCustomers = await prisma.customers.findMany({
      where: { user_id: userId },
      select: { id: true, name: true, user_id: true }
    })
    console.log(`👥 Customers owned by user: ${userCustomers.length}`)
    userCustomers.forEach(cust => console.log(`   - ${cust.name} (ID: ${cust.id})`))
    
    // Check sales
    const userSales = await prisma.sales.findMany({
      where: { user_id: userId },
      select: { id: true, total: true, user_id: true, created_at: true }
    })
    console.log(`💰 Sales owned by user: ${userSales.length}`)
    userSales.forEach(sale => console.log(`   - Sale ${sale.id}: $${sale.total} (${sale.created_at})`))
    
    // Check total counts in database
    console.log('\n📈 Total counts in database:')
    const totalCategories = await prisma.categories.count()
    const totalProducts = await prisma.products.count()
    const totalCustomers = await prisma.customers.count()
    const totalSales = await prisma.sales.count()
    
    console.log(`   - Total categories: ${totalCategories}`)
    console.log(`   - Total products: ${totalProducts}`)
    console.log(`   - Total customers: ${totalCustomers}`)
    console.log(`   - Total sales: ${totalSales}`)
    
    // Check what user_id values exist
    console.log('\n🔍 Checking user_id distribution:')
    const categoryUserIds = await prisma.categories.findMany({
      select: { user_id: true },
      distinct: ['user_id']
    })
    console.log(`   - Categories have user_ids: ${categoryUserIds.map(c => c.user_id).join(', ')}`)
    
    const productUserIds = await prisma.products.findMany({
      select: { user_id: true },
      distinct: ['user_id']
    })
    console.log(`   - Products have user_ids: ${productUserIds.map(p => p.user_id).join(', ')}`)
    
    const customerUserIds = await prisma.customers.findMany({
      select: { user_id: true },
      distinct: ['user_id']
    })
    console.log(`   - Customers have user_ids: ${customerUserIds.map(c => c.user_id).join(', ')}`)
    
    const saleUserIds = await prisma.sales.findMany({
      select: { user_id: true },
      distinct: ['user_id']
    })
    console.log(`   - Sales have user_ids: ${saleUserIds.map(s => s.user_id).join(', ')}`)
    
    // Check if there are any records without user_id
    const categoriesWithoutUserId = await prisma.categories.count({
      where: { user_id: null }
    })
    const productsWithoutUserId = await prisma.products.count({
      where: { user_id: null }
    })
    const customersWithoutUserId = await prisma.customers.count({
      where: { user_id: null }
    })
    const salesWithoutUserId = await prisma.sales.count({
      where: { user_id: null }
    })
    
    console.log('\n⚠️  Records without user_id:')
    console.log(`   - Categories: ${categoriesWithoutUserId}`)
    console.log(`   - Products: ${productsWithoutUserId}`)
    console.log(`   - Customers: ${customersWithoutUserId}`)
    console.log(`   - Sales: ${salesWithoutUserId}`)
    
  } catch (error) {
    console.error('❌ Error checking user data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUserData()
