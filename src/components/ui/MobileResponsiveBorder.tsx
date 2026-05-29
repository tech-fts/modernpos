'use client'

import { ReactNode } from 'react'
import { useMobileLayout } from '@/hooks/useMobileLayout'

interface MobileResponsiveBorderProps {
  children: ReactNode
  className?: string
  borderColor?: string
  borderWidth?: '1' | '2'
  showOnMobile?: boolean
}

/**
 * Mobile-responsive border wrapper that automatically hides borders on small screens
 * This component follows DRY principles by centralizing mobile border logic
 */
export default function MobileResponsiveBorder({ 
  children, 
  className = '', 
  borderColor = 'gray-200',
  borderWidth = '1',
  showOnMobile = false
}: MobileResponsiveBorderProps) {
  const { isMobile } = useMobileLayout()

  // DRY: Mobile-responsive border classes
  const getBorderClasses = () => {
    if (isMobile && !showOnMobile) {
      return 'border-transparent'
    }
    
    const widthClass = borderWidth === '2' ? 'border-2' : 'border'
    return `${widthClass} border-${borderColor}`
  }

  return (
    <div className={`${getBorderClasses()} ${className}`}>
      {children}
    </div>
  )
}
