const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addUserIdFields() {
  try {
    console.log('🚀 Starting migration to add user_id fields...')

    // Get the first user (admin) to use as default
    const defaultUser = await prisma.users.findFirst()
    if (!defaultUser) {
      console.error('❌ No users found in database. Please create a user first.')
      return
    }

    console.log(`📝 Using default user: ${defaultUser.email} (ID: ${defaultUser.id})`)

    // Add user_id to categories table
    console.log('📊 Adding user_id to categories...')
    await prisma.$executeRaw`ALTER TABLE categories ADD COLUMN IF NOT EXISTS user_id TEXT`
    await prisma.$executeRaw`UPDATE categories SET user_id = ${defaultUser.id} WHERE user_id IS NULL`
    await prisma.$executeRaw`ALTER TABLE categories ALTER COLUMN user_id SET NOT NULL`

    // Add user_id to customers table
    console.log('👥 Adding user_id to customers...')
    await prisma.$executeRaw`ALTER TABLE customers ADD COLUMN IF NOT EXISTS user_id TEXT`
    await prisma.$executeRaw`UPDATE customers SET user_id = ${defaultUser.id} WHERE user_id IS NULL`
    await prisma.$executeRaw`ALTER TABLE customers ALTER COLUMN user_id SET NOT NULL`

    // Add user_id to products table
    console.log('📦 Adding user_id to products...')
    await prisma.$executeRaw`ALTER TABLE products ADD COLUMN IF NOT EXISTS user_id TEXT`
    await prisma.$executeRaw`UPDATE products SET user_id = ${defaultUser.id} WHERE user_id IS NULL`
    await prisma.$executeRaw`ALTER TABLE products ALTER COLUMN user_id SET NOT NULL`

    // Add user_id to sale_items table
    console.log('🛒 Adding user_id to sale_items...')
    await prisma.$executeRaw`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS user_id TEXT`
    await prisma.$executeRaw`UPDATE sale_items SET user_id = ${defaultUser.id} WHERE user_id IS NULL`
    await prisma.$executeRaw`ALTER TABLE sale_items ALTER COLUMN user_id SET NOT NULL`

    console.log('✅ Migration completed successfully!')
    console.log('📋 Summary of changes:')
    console.log('   - Added user_id to categories table')
    console.log('   - Added user_id to customers table')
    console.log('   - Added user_id to products table')
    console.log('   - Added user_id to sale_items table')
    console.log('   - All existing records updated with default user ID')

  } catch (error) {
    console.error('❌ Migration failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

addUserIdFields()
