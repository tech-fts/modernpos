export interface Currency {
  code: string
  name: string
  symbol: string
  position: 'before' | 'after'
  decimalPlaces: number
  exchangeRate: number // Rate relative to USD
  locale: string
}

