'use client'

import { useState, useEffect } from 'react'

export function useMobileLayout() {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)
  const [screenWidth, setScreenWidth] = useState(0)

  useEffect(() => {
    const updateLayout = () => {
      const width = window.innerWidth
      setScreenWidth(width)
      
      // DRY: Centralized breakpoint definitions
      const breakpoints = {
        mobile: 768,
        tablet: 1024,
        desktop: 1280
      }
      
      setIsMobile(width <= breakpoints.mobile)
      setIsTablet(width > breakpoints.mobile && width <= breakpoints.tablet)
      setIsDesktop(width > breakpoints.tablet)
    }

    // Set initial layout
    updateLayout()

    // Add event listener
    window.addEventListener('resize', updateLayout)

    // Cleanup
    return () => window.removeEventListener('resize', updateLayout)
  }, [])

  // DRY: Helper functions for responsive design
  const getResponsiveValue = <T,>(mobileValue: T, tabletValue: T, desktopValue: T): T => {
    if (isMobile) return mobileValue
    if (isTablet) return tabletValue
    return desktopValue
  }

  const getChartDimensions = () => ({
    height: getResponsiveValue(300, 320, 400),
    padding: getResponsiveValue(10, 15, 20),
    fontSizes: {
      legend: getResponsiveValue(10, 11, 12),
      axis: getResponsiveValue(9, 10, 11),
      axisTitle: getResponsiveValue(10, 11, 12),
      tooltip: getResponsiveValue(10, 11, 12)
    },
    spacing: {
      legendPadding: getResponsiveValue(15, 18, 20),
      axisPadding: getResponsiveValue(8, 10, 12),
      gridSpacing: getResponsiveValue(0.05, 0.08, 0.1)
    }
  })

  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    getResponsiveValue,
    getChartDimensions
  }
}
