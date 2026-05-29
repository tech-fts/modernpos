const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testFiltering() {
  try {
    console.log('🧪 Testing user_id filtering...')
    
    const userId = 'user_1756475015260_hosgo61cz'
    
    // Test 1: Check if user exists and their role
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log(`✅ User found: ${user.email} (Role: ${user.role})`)
    
    // Test 2: Test filtering for non-admin user
    const isAdmin = user.role === 'ADMIN'
    console.log(`🔍 Testing filtering for ${isAdmin ? 'ADMIN' : 'NON-ADMIN'} user`)
    
    // Build where clauses (same logic as dashboard API)
    const productsWhere = {}
    const customersWhere = {}
    const categoriesWhere = {}
    const salesWhere = {}
    
    if (!isAdmin) {
      productsWhere.user_id = userId
      customersWhere.user_id = userId
      categoriesWhere.user_id = userId
      salesWhere.user_id = userId
    }
    
    console.log('\n📊 Filtering results:')
    console.log('Products where clause:', JSON.stringify(productsWhere))
    console.log('Customers where clause:', JSON.stringify(customersWhere))
    console.log('Categories where clause:', JSON.stringify(categoriesWhere))
    console.log('Sales where clause:', JSON.stringify(salesWhere))
    
    // Test 3: Count with filters
    const productsCount = await prisma.products.count({ where: productsWhere })
    const customersCount = await prisma.customers.count({ where: customersWhere })
    const categoriesCount = await prisma.categories.count({ where: categoriesWhere })
    const salesCount = await prisma.sales.count({ where: salesWhere })
    
    console.log('\n📈 Counts with filters:')
    console.log(`Products: ${productsCount}`)
    console.log(`Customers: ${customersCount}`)
    console.log(`Categories: ${categoriesCount}`)
    console.log(`Sales: ${salesCount}`)
    
    // Test 4: Check total counts without filters
    const totalProducts = await prisma.products.count()
    const totalCustomers = await prisma.customers.count()
    const totalCategories = await prisma.categories.count()
    const totalSales = await prisma.sales.count()
    
    console.log('\n📈 Total counts in database:')
    console.log(`Total Products: ${totalProducts}`)
    console.log(`Total Customers: ${totalCustomers}`)
    console.log(`Total Categories: ${totalCategories}`)
    console.log(`Total Sales: ${totalSales}`)
    
    // Test 5: Check if filtering is working
    if (!isAdmin) {
      console.log('\n🔍 Verifying filtering logic:')
      
      if (productsCount === 0 && totalProducts > 0) {
        console.log('✅ Products filtering working: User sees 0 products, database has', totalProducts)
      } else {
        console.log('❌ Products filtering issue: User sees', productsCount, 'products, database has', totalProducts)
      }
      
      if (customersCount === 0 && totalCustomers > 0) {
        console.log('✅ Customers filtering working: User sees 0 customers, database has', totalCustomers)
      } else {
        console.log('❌ Customers filtering issue: User sees', customersCount, 'customers, database has', totalCustomers)
      }
      
      if (categoriesCount === 0 && totalCategories > 0) {
        console.log('✅ Categories filtering working: User sees 0 categories, database has', totalCategories)
      } else {
        console.log('❌ Categories filtering issue: User sees', categoriesCount, 'categories, database has', totalCategories)
      }
      
      if (salesCount === 0 && totalSales > 0) {
        console.log('✅ Sales filtering working: User sees 0 sales, database has', totalSales)
      } else {
        console.log('❌ Sales filtering issue: User sees', salesCount, 'sales, database has', totalSales)
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing filtering:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testFiltering()
