export interface MfaState {
  isEnabled: boolean
  isVerified: boolean
  backupCodes: string[]
  qrCodeUrl?: string
  secret?: string
}

