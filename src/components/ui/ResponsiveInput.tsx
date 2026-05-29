import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const inputVariants = cva(
  // Base classes - mobile-first approach
  'block w-full border border-gray-300 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:border-transparent transition-colors',
  {
    variants: {
      size: {
        xs: 'px-2 py-1.5 text-xs min-h-[32px]',
        sm: 'px-3 py-2 text-sm min-h-[36px]',
        md: 'px-4 py-2.5 text-sm min-h-[40px]',
        lg: 'px-5 py-3 text-base min-h-[44px]',
        xl: 'px-6 py-4 text-lg min-h-[48px]'
      },
      mobileSize: {
        compact: 'xs:px-2 xs:py-1.5 sm:px-3 sm:py-2',
        standard: 'xs:px-3 xs:py-2 sm:px-4 sm:py-2.5',
        large: 'xs:px-4 xs:py-2.5 sm:px-5 sm:py-3'
      },
      variant: {
        default: 'bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500',
        error: 'bg-red-50 text-red-900 border-red-300 focus:ring-red-500 focus:border-red-500',
        success: 'bg-green-50 text-green-900 border-green-300 focus:ring-green-500 focus:border-green-500',
        disabled: 'bg-gray-100 text-gray-500 cursor-not-allowed'
      }
    },
    defaultVariants: {
      size: 'md',
      mobileSize: 'standard',
      variant: 'default'
    }
  }
)

export interface ResponsiveInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  label?: string
  error?: string
  success?: string
  icon?: React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  fullWidth?: boolean
  mobileOptimized?: boolean
}

export const ResponsiveInput: React.FC<ResponsiveInputProps> = ({
  className,
  size,
  mobileSize,
  variant,
  label,
  error,
  success,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = true,
  mobileOptimized = true,
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`
  
  // Determine variant based on state
  const inputVariant = error ? 'error' : success ? 'success' : variant
  
  const IconComponent = Icon && (
    <Icon 
      className={`h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6 text-gray-400 ${
        iconPosition === 'left' ? 'text-gray-400' : 'text-gray-500'
      }`} 
    />
  )

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className || ''}`}>
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-xs xs:text-sm font-medium text-gray-700 mb-1.5 xs:mb-2"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {iconPosition === 'left' && Icon && (
          <div className="absolute inset-y-0 left-0 pl-2 xs:pl-3 flex items-center pointer-events-none">
            {IconComponent}
          </div>
        )}
        
        <input
          id={inputId}
          className={`
            ${inputVariants({ size, mobileSize, variant: inputVariant })}
            ${iconPosition === 'left' && Icon ? 'pl-8 xs:pl-10 sm:pl-12' : ''}
            ${iconPosition === 'right' && Icon ? 'pr-8 xs:pr-10 sm:pr-12' : ''}
            ${mobileOptimized ? 'touch-manipulation' : ''}
          `.trim()}
          {...props}
        />
        
        {iconPosition === 'right' && Icon && (
          <div className="absolute inset-y-0 right-0 pr-2 xs:pr-3 flex items-center pointer-events-none">
            {IconComponent}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-xs xs:text-sm text-red-600">{error}</p>
      )}
      
      {success && (
        <p className="mt-1 text-xs xs:text-sm text-green-600">{success}</p>
      )}
    </div>
  )
}

export default ResponsiveInput
