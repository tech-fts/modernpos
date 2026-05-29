import { apiRequest, apiRequestJson } from '@/actions/http'
import { type MfaState } from '@/types/mfa'

export async function getMfaStatus(): Promise<MfaState> {
  return apiRequest<MfaState>('/api/auth/mfa/status')
}

export async function enableMfa(): Promise<{ qrCodeUrl?: string; secret?: string }> {
  return apiRequest<{ qrCodeUrl?: string; secret?: string }>('/api/auth/mfa/enable', { method: 'POST' })
}

export async function disableMfa(): Promise<void> {
  await apiRequest<void>('/api/auth/mfa/disable', { method: 'POST' })
}

export async function verifyMfa(code: string): Promise<void> {
  await apiRequestJson<void>('/api/auth/mfa/verify', 'POST', { code })
}

export async function generateBackupCodes(): Promise<{ backupCodes: string[] }> {
  return apiRequest<{ backupCodes: string[] }>('/api/auth/mfa/backup-codes', { method: 'POST' })
}
