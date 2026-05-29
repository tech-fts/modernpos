'use client'

import { useCurrency } from '@/contexts/CurrencyContext'

interface CurrencyDisplayProps {
  amount: number | string | null | undefined | { toString(): string }
  className?: string
}

export default function CurrencyDisplay({ amount, className = '' }: CurrencyDisplayProps) {
  const { formatCurrency } = useCurrency()
  
  if (amount === null || amount === undefined) {
    return <span className={className}>-</span>
  }
  
  const numericAmount = Number(amount)
  
  if (isNaN(numericAmount)) {
    return <span className={className}>-</span>
  }
  
  return (
    <span className={className}>
      {formatCurrency(numericAmount)}
    </span>
  )
}
