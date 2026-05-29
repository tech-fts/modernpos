import React from 'react'

interface ResponsiveGridProps {
  children: React.ReactNode
  className?: string
  cols?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  gap?: {
    xs?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
  mobileOptimized?: boolean
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  className = '',
  cols = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5 },
  gap = { xs: 3, sm: 4, md: 6, lg: 8, xl: 10 },
  mobileOptimized = true
}) => {
  // Mobile-first responsive grid column classes
  const getGridColsClasses = () => {
    const classes = []
    
    if (cols.xs !== undefined) {
      classes.push(`grid-cols-${cols.xs}`)
    }
    if (cols.sm !== undefined) {
      classes.push(`sm:grid-cols-${cols.sm}`)
    }
    if (cols.md !== undefined) {
      classes.push(`md:grid-cols-${cols.md}`)
    }
    if (cols.lg !== undefined) {
      classes.push(`lg:grid-cols-${cols.lg}`)
    }
    if (cols.xl !== undefined) {
      classes.push(`xl:grid-cols-${cols.xl}`)
    }
    
    return classes.join(' ')
  }

  // Mobile-first responsive gap classes
  const getGapClasses = () => {
    const classes = []
    
    if (gap.xs !== undefined) {
      classes.push(`gap-${gap.xs}`)
    }
    if (gap.sm !== undefined) {
      classes.push(`sm:gap-${gap.sm}`)
    }
    if (gap.md !== undefined) {
      classes.push(`md:gap-${gap.md}`)
    }
    if (gap.lg !== undefined) {
      classes.push(`lg:gap-${gap.lg}`)
    }
    if (gap.xl !== undefined) {
      classes.push(`xl:gap-${gap.xl}`)
    }
    
    return classes.join(' ')
  }

  return (
    <div 
      className={`
        grid
        ${getGridColsClasses()}
        ${getGapClasses()}
        ${mobileOptimized ? 'touch-manipulation' : ''}
        ${className}
      `.trim()}
    >
      {children}
    </div>
  )
}

export default ResponsiveGrid
