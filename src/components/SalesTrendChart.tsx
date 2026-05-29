'use client'

import { useMemo } from 'react'
import type { Chart } from 'chart.js'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useMobileLayout } from '@/hooks/useMobileLayout'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface SalesData {
  date: string
  total: number
  count: number
}

interface SalesTrendChartProps {
  data: SalesData[]
  period: 'today' | 'week' | 'month'
  chartType?: 'line' | 'bar'
}

// DRY: Reusable responsive chart configurations
const createResponsiveConfig = (isMobile: boolean) => ({
  // Mobile-optimized dimensions
  height: isMobile ? 300 : 320,
  padding: isMobile ? 10 : 20,
  
  // Font sizes based on screen size
  fontSizes: {
    legend: isMobile ? 10 : 12,
    axis: isMobile ? 9 : 11,
    axisTitle: isMobile ? 10 : 12,
    tooltip: isMobile ? 10 : 12
  },
  
  // Spacing and layout
  spacing: {
    legendPadding: isMobile ? 15 : 20,
    axisPadding: isMobile ? 8 : 12,
    gridSpacing: isMobile ? 0.05 : 0.1
  }
})

// DRY: Reusable chart options generator
const createChartOptions = (formatCurrency: (amount: number) => string, isMobile: boolean) => {
  const config = createResponsiveConfig(isMobile)
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: config.spacing.legendPadding,
          font: {
            size: config.fontSizes.legend,
            weight: 'bold' as const
          },
          // Mobile: Stack legend items vertically to save horizontal space
          ...(isMobile && {
            boxWidth: 8,
            boxHeight: 8,
            generateLabels: (chart: Chart) => {
              const datasets = (chart.data.datasets || []) as Array<{ label?: string; backgroundColor?: string; borderColor?: string }>
              return datasets.map((dataset, i: number) => ({
                text: dataset.label || '',
                fillStyle: dataset.backgroundColor || dataset.borderColor || 'rgba(0,0,0,0.2)',
                strokeStyle: dataset.borderColor || 'rgba(0,0,0,0.4)',
                lineWidth: 2,
                pointStyle: 'circle' as const,
                hidden: !chart.isDatasetVisible(i),
                index: i
              }))
            }
          })
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        titleFont: {
          size: config.fontSizes.tooltip
        },
        bodyFont: {
          size: config.fontSizes.tooltip
        },
        callbacks: {
          title: (tooltipItems: { label: string }[]) => {
            return tooltipItems[0]?.label || ''
          },
          label: (context: { datasetIndex: number; parsed: { y: number } }) => {
            if (context.datasetIndex === 0) {
              return `Revenue: ${formatCurrency(context.parsed.y)}`
            } else {
              return `Sales: ${context.parsed.y} transactions`
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: config.fontSizes.axis,
            weight: 'normal' as const
          },
          // Mobile: Optimize label rotation and spacing
          maxRotation: isMobile ? 0 : 45,
          minRotation: 0,
          padding: config.spacing.axisPadding,
          // Mobile: Reduce number of ticks to prevent overlap
          maxTicksLimit: isMobile ? 4 : 8,
          callback: function(value: string | number, index: number): string | number | null {
            // Mobile: Show only every other label to prevent overlap
            if (isMobile && index % 2 === 1) return ''
            return value
          }
        }
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: config.fontSizes.axis,
            weight: 'normal' as const
          },
          padding: config.spacing.axisPadding,
          // Mobile: Reduce number of ticks and format for better readability
          maxTicksLimit: isMobile ? 4 : 6,
          callback: function(tickValue: string | number): string | number {
            if (typeof tickValue === 'number') {
              // Mobile: Use abbreviated format for better fit
              if (isMobile && tickValue >= 1000) {
                return `${(tickValue / 1000).toFixed(1)}K`
              }
              return formatCurrency(tickValue)
            }
            return tickValue
          }
        },
        title: {
          display: true,
          text: 'Revenue',
          color: '#6b7280',
          font: {
            size: config.fontSizes.axisTitle,
            weight: 'bold' as const
          },
          // Mobile: Position title to avoid overlap
          padding: {
            top: isMobile ? 5 : 10,
            bottom: isMobile ? 5 : 10
          }
        }
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: config.fontSizes.axis,
            weight: 'normal' as const
          },
          padding: config.spacing.axisPadding,
          // Mobile: Reduce number of ticks
          maxTicksLimit: isMobile ? 4 : 6,
          callback: function(tickValue: string | number): string | number {
            if (typeof tickValue === 'number') {
              // Mobile: Use abbreviated format
              if (isMobile && tickValue >= 10) {
                return Math.round(tickValue).toString()
              }
              return tickValue.toString()
            }
            return tickValue
          }
        },
        title: {
          display: true,
          text: 'Sales Count',
          color: '#6b7280',
          font: {
            size: config.fontSizes.axisTitle,
            weight: 'bold' as const
          },
          // Mobile: Position title to avoid overlap
          padding: {
            top: isMobile ? 5 : 10,
            bottom: isMobile ? 5 : 10
          }
        }
      }
    }
  }
}

// DRY: Reusable dataset configurations
const createDatasetConfig = (chartType: 'line' | 'bar', isMobile: boolean) => {
  const baseRevenueConfig = {
    label: 'Revenue',
    borderColor: 'rgb(59, 130, 246)',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    borderWidth: isMobile ? 2 : 3,
    pointBackgroundColor: 'rgb(59, 130, 246)',
    pointBorderColor: '#ffffff',
    pointBorderWidth: isMobile ? 1 : 2,
    pointRadius: isMobile ? 3 : 6,
    pointHoverRadius: isMobile ? 5 : 8,
    tension: 0.4,
    fill: true,
  }

  const baseSalesConfig = {
    label: 'Sales Count',
    borderColor: 'rgb(16, 185, 129)',
    backgroundColor: 'rgba(16, 185, 129, 0.8)',
    borderWidth: isMobile ? 1 : 2,
    pointBackgroundColor: 'rgb(16, 185, 129)',
    pointBorderColor: '#ffffff',
    pointBorderWidth: isMobile ? 1 : 2,
    pointRadius: isMobile ? 2 : 4,
    pointHoverRadius: isMobile ? 4 : 6,
    tension: 0.4,
    fill: false,
    yAxisID: 'y1',
  }

  if (chartType === 'bar') {
    return {
      revenue: {
        ...baseRevenueConfig,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: isMobile ? 2 : 4,
        borderSkipped: false,
      },
      sales: {
        ...baseSalesConfig,
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
        borderRadius: isMobile ? 2 : 4,
        borderSkipped: false,
      }
    }
  }

  return {
    revenue: baseRevenueConfig,
    sales: baseSalesConfig
  }
}

export default function SalesTrendChart({ data, period, chartType = 'line' }: SalesTrendChartProps) {
  const { formatCurrency } = useCurrency()
  const { isMobile, getChartDimensions } = useMobileLayout()

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null

    // Debug: Log the raw data to see what we're working with
    console.log('SalesTrendChart - Raw data:', data)
    console.log('SalesTrendChart - Period:', period)

    // Sort data by date
    const sortedData = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    
    // Debug: Log sorted data
    console.log('SalesTrendChart - Sorted data:', sortedData)
    
    // DRY: Reusable date formatting function
    const formatLabel = (dateString: string) => {
      try {
        console.log('Formatting date string:', dateString)
        const date = new Date(dateString)
        console.log('Parsed date object:', date)
        console.log('Date timestamp:', date.getTime())
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
          console.warn('Invalid date string:', dateString)
          return dateString
        }
        
        let formattedLabel: string
        switch (period) {
          case 'today':
            // For today, check if the date string contains time information
            if (dateString.includes('T') && dateString.includes(':')) {
              // Has time info, format as time
              formattedLabel = date.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true
              })
            } else {
              // Only date, format as date
              formattedLabel = date.toLocaleDateString('en-US', { 
                month: 'short',
                day: 'numeric'
              })
            }
            break
          case 'week':
            // For week, show day and date
            formattedLabel = date.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short',
              day: 'numeric'
            })
            break
          case 'month':
            // For month, show month and day
            formattedLabel = date.toLocaleDateString('en-US', { 
              month: 'short',
              day: 'numeric'
            })
            break
          default:
            formattedLabel = date.toLocaleDateString('en-US')
        }
        
        console.log('Formatted label:', formattedLabel)
        return formattedLabel
      } catch (error) {
        console.error('Error formatting date:', dateString, error)
        return dateString
      }
    }

    // DRY: Get dataset configuration
    const datasetConfig = createDatasetConfig(chartType, isMobile)

    const baseConfig = {
      labels: sortedData.map(item => formatLabel(item.date)),
      datasets: [
        {
          ...datasetConfig.revenue,
          data: sortedData.map(item => item.total),
        },
        {
          ...datasetConfig.sales,
          data: sortedData.map(item => item.count),
        }
      ]
    }

    return baseConfig
  }, [data, period, chartType, isMobile])

  // DRY: Create chart options using reusable function
  const options = useMemo(() => 
    createChartOptions(formatCurrency, isMobile), 
    [formatCurrency, isMobile]
  )

  if (!chartData) {
    return (
      <div className="flex items-center justify-center" style={{ height: `${getChartDimensions().height}px` }}>
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No sales data available</p>
          <p className="text-gray-400 text-xs mt-1">Select a different time period or check your data</p>
        </div>
      </div>
    )
  }

  // DRY: Dynamic height based on mobile detection using hook
  const chartHeight = getChartDimensions().height

  return (
    <div className="w-full" style={{ height: `${chartHeight}px` }}>
      {chartType === 'line' ? (
        <Line data={chartData} options={options} />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </div>
  )
}
