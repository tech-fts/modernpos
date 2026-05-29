export interface ImportResultSummary {
  total: number
  success: number
  errors: number
}

export interface ImportApiResponse {
  message: string
  summary: ImportResultSummary
  errors?: string[]
}

