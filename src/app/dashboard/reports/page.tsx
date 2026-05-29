'use client'

import { useState, useMemo } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { useCurrency } from '@/contexts/CurrencyContext'
import { useSmartDataFetching } from '@/hooks'
import { LoadingSpinner, Card } from '@/components/ui'
import SalesTrendChart from '@/components/SalesTrendChart'
import { type ReportData, type ReportsApiResponse } from '@/types/report'
import { getSalesReport } from '@/actions/reports'
import { 
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline'

export default function ReportsPage() {
  const { addNotification } = useNotifications()
  const { formatCurrency } = useCurrency()
  const today = new Date().toISOString().split('T')[0]
  const [startDate, setStartDate] = useState<string>(today)
  const [endDate, setEndDate] = useState<string>(today)
  const [chartType, setChartType] = useState<'line' | 'bar'>('line')

  // Use smart data fetching with caching
  const { 
    data: reportData, 
    loading, 
    error,
    refetch: fetchReportData 
  } = useSmartDataFetching<ReportsApiResponse>({
    cacheKey: `reports:sales:${startDate}:${endDate}`,
    fetcher: ({ signal }) => getSalesReport({ startDate, endDate }, signal),
    autoFetch: true,
    cacheDuration: 300000, // Cache for 5 minutes
    debounceDelay: 500, // Debounce API calls
    onError: () => {
      addNotification({
        type: 'error',
        title: 'Fetch Failed',
        message: 'Failed to fetch report data. Please try again.',
        duration: 5000
      })
    }
  })

  // Memoize processed data to prevent recalculation
  const processedData = useMemo(() => {
    if (!reportData || !reportData.salesData || reportData.salesData.length === 0) {
      return null
    }
    
    return {
      ...reportData,
      chartData: reportData.salesData.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        total: item.total,
        count: item.count
      }))
    }
  }, [reportData])

  const formatAmount = (amount: number) => {
    const formatted = formatCurrency(amount)
    if (formatted.endsWith('MMK')) {
      return (
        <>
          {formatted.slice(0, -3)}
          <span className="ml-0.5 text-[10px] xs:text-xs font-semibold text-gray-500">MMK</span>
        </>
      )
    }
    return formatted
  }

  const periodLabel = startDate === endDate
    ? new Date(startDate).toLocaleDateString()
    : `${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}`

  const handleRefresh = () => {
    fetchReportData()
    addNotification({
      type: 'success',
      title: 'Refreshed',
      message: 'Reports data has been refreshed.',
      duration: 3000
    })
  }

  const handleExportReport = async () => {
    if (!processedData) return

    try {
      const csvContent = generateCSV(processedData)
      downloadCSV(csvContent, `sales-report-${startDate}-${endDate}.csv`)
      
      addNotification({
        type: 'success',
        title: 'Export Successful',
        message: 'Report has been exported successfully.',
        duration: 3000
      })
    } catch (error) {
      console.error('Report export failed:', error)
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'Failed to export report. Please try again.',
        duration: 5000
      })
    }
  }

  const generateCSV = (data: ReportData) => {
    const headers = ['Date', 'Revenue', 'Sales Count']
    const rows = data.salesData.map(item => [
      item.date,
      item.total.toString(),
      item.count.toString()
    ])
    
    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')
  }

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <div className="p-6 text-center">
          <h3 className="text-lg font-medium text-red-800">Error Loading Reports</h3>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={handleRefresh}
            className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Try Again
          </button>
        </div>
      </Card>
    )
  }

  // Show data even if there's no sales data but we have the summary
  if (!processedData && reportData && reportData.summary) {
    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          <Card className="bg-blue-50 border-blue-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                    <dd className="text-lg font-medium text-gray-900">{formatAmount(reportData.summary.totalRevenue)}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingCartIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                    <dd className="text-lg font-medium text-gray-900">{reportData.summary.totalSales}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className={`h-6 w-6 ${reportData.summary.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Profit</dt>
                    <dd className={`text-lg font-medium ${reportData.summary.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {reportData.summary.profit >= 0 ? '+' : '-'}
                      {formatAmount(Math.abs(reportData.summary.profit))}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* No chart data message */}
        <Card>
          <div className="p-6 text-center">
            <p className="text-gray-500">No detailed sales data available for the selected period</p>
            <p className="text-sm text-gray-400 mt-2">Summary data is shown above</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!processedData) {
    return (
      <Card>
        <div className="p-6 text-center">
          <p className="text-gray-500">No report data available</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Reports</h1>
          <p className="mt-2 text-sm text-gray-700">
            Analyze your sales performance and trends
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row sm:flex-wrap lg:flex-nowrap gap-3 sm:gap-3 md:items-end">
          {/* Period Selector (dropdown style) */}
          <div className="flex w-full sm:w-auto gap-2 md:gap-1.5">
            <div className="flex-1 sm:flex-none">
              <label className="block text-xs font-medium text-gray-500 mb-1 md:text-[11px]">From</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-2.5 md:py-2 md:text-xs"
              />
            </div>
            <div className="flex-1 sm:flex-none">
              <label className="block text-xs font-medium text-gray-500 mb-1 md:text-[11px]">To</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-2.5 md:py-2 md:text-xs"
              />
            </div>
          </div>

          {/* Chart Type Selector (dropdown style) */}
          <div className="relative w-full sm:w-36 md:w-28">
            <select
              value={chartType}
              onChange={(e) => setChartType(e.target.value as 'line' | 'bar')}
              className="w-full appearance-none rounded-md border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 md:px-3 md:py-2 md:text-xs"
            >
              <option value="line">Line</option>
              <option value="bar">Bar</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 w-full sm:w-auto sm:flex-nowrap">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2 md:mr-0 lg:mr-2" />
              <span className="inline md:hidden lg:inline">Refresh</span>
            </button>
            <button
              onClick={handleExportReport}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 sm:flex-none"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatAmount(processedData.summary.totalRevenue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ShoppingCartIcon className="h-6 w-6 text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Sales</dt>
                                     <dd className="text-lg font-medium text-gray-900">{processedData.summary.totalSales}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className={`h-6 w-6 ${processedData.summary.profit >= 0 ? 'text-green-500' : 'text-red-500'}`} />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Profit</dt>
                  <dd className={`text-lg font-medium ${processedData.summary.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {processedData.summary.profit >= 0 ? '+' : '-'}
                    {formatAmount(Math.abs(processedData.summary.profit))}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-indigo-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Period</dt>
                  <dd className="text-lg font-medium text-gray-900">{periodLabel}</dd>
                </dl>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Sales Trend</h3>
          <SalesTrendChart 
            data={processedData.chartData}
            period={startDate === endDate ? 'today' : 'month'}
            chartType={chartType}
          />
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Detailed Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales Count</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {processedData.chartData.map((item, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(item.total)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}
