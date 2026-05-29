function normalizeSkuBase(name: string): string {
  const cleaned = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  return cleaned ? cleaned.slice(0, 12) : 'ITEM'
}

export function generateSku(name: string): string {
  const base = normalizeSkuBase(name)
  const timePart = Date.now().toString(36).toUpperCase()
  const randomPart = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `${base}-${timePart}-${randomPart}`
}

function generateNumericString(length: number): string {
  let out = ''
  while (out.length < length) {
    out += Math.floor(Math.random() * 10).toString()
  }
  return out.slice(0, length)
}

function ean13CheckDigit(base12: string): string {
  let sum = 0
  for (let i = 0; i < 12; i++) {
    const digit = Number(base12[i])
    sum += i % 2 === 0 ? digit : digit * 3
  }
  const mod = sum % 10
  const check = (10 - mod) % 10
  return String(check)
}

export function generateBarcodeEan13(): string {
  const timestamp = Date.now().toString()
  let base12 = timestamp.slice(-12)
  if (base12.length < 12) {
    base12 = (timestamp + generateNumericString(12)).slice(0, 12)
  }

  // Ensure numeric-only (timestamp is numeric, but keep this defensive)
  base12 = base12.replace(/\D/g, '')
  if (base12.length !== 12) {
    base12 = generateNumericString(12)
  }

  return base12 + ean13CheckDigit(base12)
}

