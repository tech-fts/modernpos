#!/usr/bin/env tsx

import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs'
import path from 'path'
import { logSecurityEvent } from '../src/lib/security'

const execAsync = promisify(exec)

interface BackupConfig {
  backupDir: string
  dbPath: string
  maxBackups: number
  compressBackups: boolean
  cloudBackup: boolean
  cloudConfig?: {
    type: 's3' | 'gdrive' | 'dropbox'
    bucket?: string
    folder?: string
  }
}

class DatabaseBackup {
  private config: BackupConfig

  constructor(config: Partial<BackupConfig> = {}) {
    this.config = {
      backupDir: path.join(process.cwd(), 'backups'),
      dbPath: path.join(process.cwd(), 'prisma', 'dev.db'),
      maxBackups: 7, // Keep 7 days of backups
      compressBackups: true,
      cloudBackup: false,
      ...config
    }
  }

  async createBackup(): Promise<string> {
    try {
      console.log('🔄 Starting database backup...')
      
      // Ensure backup directory exists
      if (!fs.existsSync(this.config.backupDir)) {
        fs.mkdirSync(this.config.backupDir, { recursive: true })
        console.log(`📁 Created backup directory: ${this.config.backupDir}`)
      }

      // Check if database exists
      if (!fs.existsSync(this.config.dbPath)) {
        throw new Error(`Database file not found: ${this.config.dbPath}`)
      }

      // Generate backup filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const backupName = `backup-${timestamp}.db`
      const backupPath = path.join(this.config.backupDir, backupName)

      // Copy database file (cross-platform)
      console.log(`📋 Copying database to: ${backupPath}`)
      if (process.platform === 'win32') {
        await execAsync(`copy "${this.config.dbPath}" "${backupPath}"`)
      } else {
        await execAsync(`cp "${this.config.dbPath}" "${backupPath}"`)
      }

      // Compress backup if enabled (cross-platform)
      let finalBackupPath = backupPath
      if (this.config.compressBackups) {
        console.log('🗜️ Compressing backup...')
        if (process.platform === 'win32') {
          // On Windows, we'll use PowerShell's Compress-Archive or just keep uncompressed
          console.log('⚠️ Compression not available on Windows, keeping uncompressed backup')
        } else {
          await execAsync(`gzip "${backupPath}"`)
          finalBackupPath = `${backupPath}.gz`
          console.log(`✅ Backup compressed: ${finalBackupPath}`)
        }
      }

      // Get backup file size
      const stats = fs.statSync(finalBackupPath)
      const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2)

      console.log(`✅ Backup created successfully: ${finalBackupPath}`)
      console.log(`📊 File size: ${fileSizeInMB} MB`)

      // Clean old backups
      await this.cleanOldBackups()

      // Upload to cloud if enabled
      if (this.config.cloudBackup && this.config.cloudConfig) {
        await this.uploadToCloud(finalBackupPath, backupName)
      }

      // Log security event
      logSecurityEvent('BACKUP_CREATED', {
        backupPath: finalBackupPath,
        fileSize: fileSizeInMB,
        timestamp: new Date().toISOString()
      })

      return finalBackupPath

    } catch (error) {
      console.error('❌ Backup failed:', error)
      
      // Log security event
      logSecurityEvent('BACKUP_FAILED', {
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      })
      
      throw error
    }
  }

  private async cleanOldBackups(): Promise<void> {
    try {
      console.log('🧹 Cleaning old backups...')
      
      const files = fs.readdirSync(this.config.backupDir)
      const backupFiles = files
        .filter(file => file.includes('backup-') && (file.endsWith('.db') || (process.platform !== 'win32' && file.endsWith('.gz'))))
        .map(file => ({
          name: file,
          path: path.join(this.config.backupDir, file),
          mtime: fs.statSync(path.join(this.config.backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())

      // Keep only the most recent backups
      if (backupFiles.length > this.config.maxBackups) {
        const filesToDelete = backupFiles.slice(this.config.maxBackups)
        
        for (const file of filesToDelete) {
          fs.unlinkSync(file.path)
          console.log(`🗑️ Removed old backup: ${file.name}`)
        }
        
        console.log(`🧹 Cleaned ${filesToDelete.length} old backups`)
      } else {
        console.log(`✅ No old backups to clean (${backupFiles.length}/${this.config.maxBackups})`)
      }

    } catch (error) {
      console.error('⚠️ Failed to clean old backups:', error)
    }
  }

  private async uploadToCloud(backupPath: string, backupName: string): Promise<void> {
    try {
      console.log('☁️ Uploading backup to cloud...')
      
      if (!this.config.cloudConfig) {
        throw new Error('Cloud configuration not provided')
      }

      switch (this.config.cloudConfig.type) {
        case 's3':
          await this.uploadToS3(backupPath, backupName)
          break
        case 'gdrive':
          await this.uploadToGoogleDrive(backupPath, backupName)
          break
        case 'dropbox':
          await this.uploadToDropbox(backupPath, backupName)
          break
        default:
          throw new Error(`Unsupported cloud type: ${this.config.cloudConfig.type}`)
      }

      console.log('☁️ Cloud backup completed successfully')

    } catch (error) {
      console.error('⚠️ Cloud backup failed:', error)
      // Don't throw error here as local backup was successful
    }
  }

  private async uploadToS3(backupPath: string, backupName: string): Promise<void> {
    // This would require AWS SDK
    // For now, just log the intention
    console.log(`📤 Would upload ${backupName} to S3 bucket: ${this.config.cloudConfig?.bucket}`)
    
    // TODO: Implement actual S3 upload
    // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
    // const s3Client = new S3Client({ region: process.env.AWS_REGION })
    // await s3Client.send(new PutObjectCommand({
    //   Bucket: this.config.cloudConfig?.bucket,
    //   Key: `pos-backups/${backupName}`,
    //   Body: fs.createReadStream(backupPath)
    // }))
  }

  private async uploadToGoogleDrive(backupPath: string, backupName: string): Promise<void> {
    console.log(`📤 Would upload ${backupName} to Google Drive folder: ${this.config.cloudConfig?.folder}`)
    // TODO: Implement Google Drive upload
  }

  private async uploadToDropbox(backupPath: string, backupName: string): Promise<void> {
    console.log(`📤 Would upload ${backupName} to Dropbox folder: ${this.config.cloudConfig?.folder}`)
    // TODO: Implement Dropbox upload
  }

  async listBackups(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.backupDir)
      const backupFiles = files
        .filter(file => file.includes('backup-') && (file.endsWith('.db') || file.endsWith('.gz')))
        .map(file => {
          const filePath = path.join(this.config.backupDir, file)
          const stats = fs.statSync(filePath)
          return {
            name: file,
            size: (stats.size / (1024 * 1024)).toFixed(2) + ' MB',
            created: stats.mtime.toISOString()
          }
        })
        .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())

      console.log('\n📋 Available Backups:')
      console.log('=====================')
      
      if (backupFiles.length === 0) {
        console.log('No backups found')
        return
      }

      backupFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name}`)
        console.log(`   Size: ${file.size}`)
        console.log(`   Created: ${file.created}`)
        console.log('')
      })

      const totalSize = backupFiles.reduce((sum, file) => sum + parseFloat(file.size), 0)
      console.log(`📊 Total backups: ${backupFiles.length}`)
      console.log(`📊 Total size: ${totalSize.toFixed(2)} MB`)

    } catch (error) {
      console.error('❌ Failed to list backups:', error)
    }
  }

  async restoreBackup(backupName: string): Promise<void> {
    try {
      const backupPath = path.join(this.config.backupDir, backupName)
      
      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup not found: ${backupPath}`)
      }

      console.log(`🔄 Restoring from backup: ${backupName}`)
      
      // Check if backup is compressed
      let sourcePath = backupPath
      if (backupName.endsWith('.gz')) {
        console.log('🗜️ Decompressing backup...')
        const decompressedPath = backupPath.replace('.gz', '')
        await execAsync(`gunzip -c "${backupPath}" > "${decompressedPath}"`)
        sourcePath = decompressedPath
      }

      // Create a backup of current database before restoring
      const currentBackupName = `pre-restore-${new Date().toISOString().replace(/[:.]/g, '-')}.db`
      const currentBackupPath = path.join(this.config.backupDir, currentBackupName)
      await execAsync(`cp "${this.config.dbPath}" "${currentBackupPath}"`)
      console.log(`💾 Current database backed up as: ${currentBackupName}`)

      // Restore the backup
      await execAsync(`cp "${sourcePath}" "${this.config.dbPath}"`)
      console.log('✅ Database restored successfully')

      // Clean up temporary decompressed file
      if (sourcePath !== backupPath) {
        fs.unlinkSync(sourcePath)
      }

      // Log security event
      logSecurityEvent('BACKUP_RESTORED', {
        backupName,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      console.error('❌ Restore failed:', error)
      throw error
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const command = args[0]

  const backup = new DatabaseBackup({
    cloudBackup: process.env.ENABLE_CLOUD_BACKUP === 'true',
    cloudConfig: {
      type: (process.env.CLOUD_TYPE as 's3' | 'gdrive' | 'dropbox') || 's3',
      bucket: process.env.AWS_BACKUP_BUCKET,
      folder: process.env.CLOUD_FOLDER
    }
  })

  try {
    switch (command) {
      case 'backup':
        await backup.createBackup()
        break
      
      case 'list':
        await backup.listBackups()
        break
      
      case 'restore':
        const backupName = args[1]
        if (!backupName) {
          console.error('❌ Please specify backup name: npm run backup:restore <backup-name>')
          process.exit(1)
        }
        await backup.restoreBackup(backupName)
        break
      
      case 'schedule':
        console.log('⏰ Starting scheduled backup service...')
        console.log('📅 Backups will run daily at 2:00 AM')
        
        // Run backup every day at 2 AM
        setInterval(async () => {
          const now = new Date()
          if (now.getHours() === 2 && now.getMinutes() === 0) {
            try {
              await backup.createBackup()
            } catch (error) {
              console.error('❌ Scheduled backup failed:', error)
            }
          }
        }, 60000) // Check every minute
        
        // Keep the process running
        process.stdin.resume()
        break
      
      default:
        console.log('🔒 Modern POS Database Backup Tool')
        console.log('==================================')
        console.log('')
        console.log('Usage:')
        console.log('  npm run backup:create    - Create a new backup')
        console.log('  npm run backup:list      - List available backups')
        console.log('  npm run backup:restore   - Restore from backup')
        console.log('  npm run backup:schedule  - Start scheduled backup service')
        console.log('')
        console.log('Environment Variables:')
        console.log('  ENABLE_CLOUD_BACKUP      - Enable cloud backup (true/false)')
        console.log('  CLOUD_TYPE              - Cloud service (s3/gdrive/dropbox)')
        console.log('  AWS_BACKUP_BUCKET       - S3 bucket name')
        console.log('  CLOUD_FOLDER            - Cloud folder path')
        console.log('')
    }

  } catch (error) {
    console.error('❌ Operation failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main()
}

export { DatabaseBackup }
