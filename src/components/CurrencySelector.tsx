'use client'

import { useState } from 'react'
import { useCurrency, SUPPORTED_CURRENCIES } from '@/contexts/CurrencyContext'
import { ChevronDownIcon, GlobeAltIcon } from '@heroicons/react/24/outline'

export default function CurrencySelector() {
  const { currentCurrency, setCurrentCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)

  const handleCurrencyChange = (currency: typeof SUPPORTED_CURRENCIES[0]) => {
    console.log('🔄 CurrencySelector: Changing currency from', currentCurrency.code, 'to', currency.code)
    setCurrentCurrency(currency)
    setIsOpen(false)
    console.log('✅ CurrencySelector: Currency changed to', currency.code)
  }

  return (
    <div className="relative">
             <button
         onClick={() => setIsOpen(!isOpen)}
         className="flex items-center space-x-1 xs:space-x-1.5 md:space-x-2 px-1.5 xs:px-2 md:px-3 py-1 xs:py-1.5 md:py-2 text-[10px] xs:text-xs md:text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto justify-center sm:justify-start"
       >
         <GlobeAltIcon className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-4 md:w-4 text-gray-500" />
         <span className="flex items-center space-x-1">
           <span className="text-[10px] xs:text-xs md:text-sm font-bold">{currentCurrency.symbol}</span>
           <span className="hidden md:inline">{currentCurrency.code}</span>
         </span>
         <ChevronDownIcon className="h-2.5 w-2.5 xs:h-3 xs:w-3 md:h-4 md:w-4 text-gray-400" />
       </button>

             {isOpen && (
         <div className="absolute right-0 sm:right-0 left-0 sm:left-auto mt-2 w-full sm:w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50">
           <div className="py-1">
             <div className="px-3 xs:px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100 max-sm:hidden">
               Select Currency
             </div>
            {SUPPORTED_CURRENCIES.map((currency) => (
                             <button
                 key={currency.code}
                 onClick={() => handleCurrencyChange(currency)}
                 className={`w-full text-left px-3 xs:px-4 py-2 xs:py-3 text-xs xs:text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none ${
                   currentCurrency.code === currency.code
                     ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                     : 'text-gray-700'
                 }`}
               >
                 <div className="flex items-center justify-between">
                   <div className="flex items-center space-x-2 xs:space-x-3">
                     <span className="text-sm xs:text-base md:text-lg font-bold">{currency.symbol}</span>
                     <div>
                       <div className="font-medium text-[10px] xs:text-xs md:text-sm max-sm:hidden">{currency.name}</div>
                       <div className="text-[10px] xs:text-xs md:text-sm text-gray-500 xs:hidden">{currency.code}</div>
                     </div>
                   </div>
                   {currentCurrency.code === currency.code && (
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                   )}
                 </div>
               </button>
            ))}
          </div>
        </div>
      )}

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}
