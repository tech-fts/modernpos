import { useState, useEffect } from 'react'

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState<string>('')

  useEffect(() => {
    // Generate a random CSRF token
    const generateToken = () => {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }

    setCsrfToken(generateToken())
  }, [])

  return csrfToken
}

// Validate CSRF token
export const validateCsrfToken = (token: string, storedToken: string): boolean => {
  return token === storedToken && token.length === 64
}
