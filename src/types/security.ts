export type SecurityStatusLevel = 'secure' | 'warning' | 'insecure'

export interface SecurityStatus {
  status: SecurityStatusLevel
  details: string
  timestamp: string
}

export interface SecurityValidation {
  isValid: boolean
  warnings: string[]
  recommendations: string[]
}

export interface SecurityHealthAdditionalChecks {
  environment: string
  hasJwtSecret: boolean
  jwtSecretLength: number
  forceHttps: boolean
  localhostHttps: boolean
  timestamp?: string
}

export interface SecurityHealthData {
  cookieSecurity: SecurityStatus
  validation: SecurityValidation
  additionalChecks: SecurityHealthAdditionalChecks
  recommendations?: string[]
  warnings?: string[]
}

export interface SecurityHealthApiResponse {
  status: string
  message: string
  data: SecurityHealthData
}

