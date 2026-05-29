'use client'

import { ReactNode } from 'react'
import { useMobileLayout } from '@/hooks/useMobileLayout'

interface MobileOptimizedChartProps {
  children: ReactNode
  title?: string
  className?: string
  minHeight?: number
}

/**
 * Mobile-optimized chart container that ensures perfect display at 320px width
 * This component follows DRY principles by centralizing mobile chart layout logic
 */
export default function MobileOptimizedChart({ 
  children, 
  title, 
  className = '', 
  minHeight 
}: MobileOptimizedChartProps) {
  const { isMobile, getChartDimensions } = useMobileLayout()
  const dimensions = getChartDimensions()

  // DRY: Responsive container styles
  const containerStyles = {
    height: minHeight || dimensions.height,
    minHeight: minHeight || dimensions.height,
    width: '100%',
    overflow: 'hidden' as const,
    position: 'relative' as const
  }

  // DRY: Responsive title styles
  const titleStyles = {
    fontSize: isMobile ? '14px' : '16px',
    fontWeight: '600' as const,
    marginBottom: isMobile ? '12px' : '16px',
    textAlign: 'center' as const,
    color: '#374151'
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border border-gray-100 p-4 ${className}`}
      style={containerStyles}
    >
      {title && (
        <h3 style={titleStyles}>
          {title}
        </h3>
      )}
      
      {/* Chart container with mobile-optimized dimensions */}
      <div 
        className="w-full h-full flex items-center justify-center"
        style={{ 
          height: `calc(100% - ${title ? (isMobile ? 40 : 50) : 0}px)`,
          minHeight: isMobile ? 250 : 300
        }}
      >
        {children}
      </div>
    </div>
  )
}
