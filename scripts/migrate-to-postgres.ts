#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const prisma = new PrismaClient()

async function migrateToPostgres() {
  console.log('🚀 Starting migration from SQLite to PostgreSQL...')
  
  try {
    // Step 1: Check if we have a SQLite database
    const sqlitePath = join(process.cwd(), 'prisma', 'dev.db')
    const sqliteExists = require('fs').existsSync(sqlitePath)
    
    if (!sqliteExists) {
      console.log('❌ No SQLite database found. Please run the seed script first.')
      return
    }
    
    console.log('✅ SQLite database found')
    
    // Step 2: Generate Prisma client for PostgreSQL
    console.log('📦 Generating Prisma client...')
    execSync('npx prisma generate', { stdio: 'inherit' })
    
    // Step 3: Push the schema to PostgreSQL
    console.log('🗄️  Pushing schema to PostgreSQL...')
    execSync('npx prisma db push', { stdio: 'inherit' })
    
    // Step 4: Seed the PostgreSQL database
    console.log('🌱 Seeding PostgreSQL database...')
    execSync('npm run db:seed:all', { stdio: 'inherit' })
    
    console.log('✅ Migration completed successfully!')
    console.log('')
    console.log('📋 Next steps:')
    console.log('1. Update your .env file with production values')
    console.log('2. Test the application: npm run dev')
    console.log('3. Run production build: npm run build')
    console.log('4. Deploy to your chosen platform')
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  migrateToPostgres()
}
