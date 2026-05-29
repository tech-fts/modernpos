import React from 'react'

interface MobileOptimizedCardProps {
  children: React.ReactNode
  className?: string
  padding?: 'xs' | 'sm' | 'md' | 'lg'
  variant?: 'default' | 'elevated' | 'outlined' | 'filled'
  onClick?: () => void
  hover?: boolean
  mobileLayout?: 'stacked' | 'horizontal' | 'auto'
}

export const MobileOptimizedCard: React.FC<MobileOptimizedCardProps> = ({ 
  children, 
  className = '', 
  padding = 'md',
  variant = 'default',
  onClick,
  hover = false,
  mobileLayout = 'auto'
}) => {
  // Mobile-first responsive padding classes
  const paddingClasses = {
    xs: 'p-2 xs:p-3 sm:p-4',
    sm: 'p-3 xs:p-4 sm:p-5',
    md: 'p-4 xs:p-5 sm:p-6',
    lg: 'p-5 xs:p-6 sm:p-8'
  }

  // Mobile-first responsive variant classes
  const variantClasses = {
    default: 'bg-white border border-gray-100',
    elevated: 'bg-white shadow-lg border border-gray-100',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50 border border-gray-200'
  }

  // Mobile-first responsive base classes
  const baseClasses = 'rounded-lg xs:rounded-xl shadow-sm'
  const hoverClasses = hover ? 'hover:shadow-md transition-shadow duration-200' : ''
  const clickableClasses = onClick ? 'cursor-pointer' : ''

  // Mobile-specific layout classes
  const layoutClasses = {
    stacked: 'flex flex-col space-y-3',
    horizontal: 'flex items-center justify-between',
    auto: ''
  }

  return (
    <div 
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${paddingClasses[padding]} 
        ${hoverClasses} 
        ${clickableClasses} 
        ${layoutClasses[mobileLayout]}
        ${className}
      `.trim()}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export default MobileOptimizedCard
