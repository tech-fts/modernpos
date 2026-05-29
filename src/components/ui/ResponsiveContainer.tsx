import React from 'react'

interface ResponsiveContainerProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg'
  mobileOptimized?: boolean
}

export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  className = '',
  maxWidth = 'full',
  padding = 'md',
  mobileOptimized = true
}) => {
  // Mobile-first responsive max-width classes
  const maxWidthClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full'
  }

  // Mobile-first responsive padding classes
  const paddingClasses = {
    none: '',
    xs: 'px-2 xs:px-3 sm:px-4',
    sm: 'px-3 xs:px-4 sm:px-6',
    md: 'px-4 xs:px-6 sm:px-8',
    lg: 'px-6 xs:px-8 sm:px-12'
  }

  // Mobile-first responsive margin classes
  const marginClasses = 'mx-auto'

  return (
    <div 
      className={`
        ${maxWidthClasses[maxWidth]}
        ${paddingClasses[padding]}
        ${marginClasses}
        ${mobileOptimized ? 'touch-manipulation' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}

export default ResponsiveContainer
