import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  // Base classes - mobile-first approach
  'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-blue-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
        ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
        outline: 'bg-white text-gray-700 border-2 border-gray-300 hover:bg-gray-50 focus:ring-blue-500'
      },
      size: {
        xs: 'px-2 py-1.5 text-xs rounded-md min-h-[32px] min-w-[32px]',
        sm: 'px-3 py-2 text-sm rounded-lg min-h-[36px] min-w-[36px]',
        md: 'px-4 py-2.5 text-sm rounded-lg min-h-[40px] min-w-[40px]',
        lg: 'px-5 py-3 text-base rounded-lg min-h-[44px] min-w-[44px]',
        xl: 'px-6 py-4 text-lg rounded-xl min-h-[48px] min-w-[48px]'
      },
      mobileSize: {
        compact: 'xs:px-2 xs:py-1.5 sm:px-3 sm:py-2',
        standard: 'xs:px-3 xs:py-2 sm:px-4 sm:py-2.5',
        large: 'xs:px-4 xs:py-2.5 sm:px-5 sm:py-3'
      }
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      mobileSize: 'standard'
    }
  }
)

export interface ResponsiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
  iconPosition?: 'left' | 'right'
  loading?: boolean
  fullWidth?: boolean
  mobileOptimized?: boolean
}

export const ResponsiveButton: React.FC<ResponsiveButtonProps> = ({
  className,
  variant,
  size,
  mobileSize,
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  mobileOptimized = true,
  children,
  ...props
}) => {
  const IconComponent = Icon && (
    <Icon 
      className={`${
        iconPosition === 'left' ? 'mr-1.5 xs:mr-2' : 'ml-1.5 xs:ml-2'
      } h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5`} 
    />
  )

  return (
    <button
      className={`
        ${buttonVariants({ variant, size, mobileSize })}
        ${fullWidth ? 'w-full' : ''}
        ${mobileOptimized ? 'touch-manipulation' : ''}
        ${className || ''}
      `.trim()}
      {...props}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-3.5 w-3.5 xs:h-4 xs:w-4 sm:h-5 sm:w-5 border-b-2 border-current mr-1.5 xs:mr-2" />
          {children}
        </>
      ) : (
        <>
          {iconPosition === 'left' && IconComponent}
          {children}
          {iconPosition === 'right' && IconComponent}
        </>
      )}
    </button>
  )
}

export default ResponsiveButton
