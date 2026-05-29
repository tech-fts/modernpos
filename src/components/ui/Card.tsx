import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined'
  onClick?: () => void
  hover?: boolean
  hideBorderOnMobile?: boolean
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default',
  onClick,
  hover = false,
  hideBorderOnMobile = true
}) => {
  const paddingClasses = {
    sm: 'p-3',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8'
  }

  // DRY: Mobile-responsive border classes
  const getBorderClasses = () => {
    const baseBorder = variant === 'outlined' ? 'border-2' : 'border'
    
    if (hideBorderOnMobile) {
      // Hide borders on mobile (320px), show on larger screens
      return `${baseBorder} border-transparent sm:border-gray-100 md:border-gray-100`
    }
    
    // Default border behavior
    switch (variant) {
      case 'default':
        return 'border border-gray-100'
      case 'elevated':
        return 'border border-gray-100'
      case 'outlined':
        return 'border-2 border-gray-200'
      default:
        return 'border border-gray-100'
    }
  }

  const baseClasses = 'bg-white rounded-xl shadow-sm'
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''
  const borderClasses = getBorderClasses()

  return (
    <div 
      className={`
        ${baseClasses} 
        ${borderClasses}
        ${paddingClasses[padding]} 
        ${hoverClasses} 
        ${clickableClasses} 
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default Card
