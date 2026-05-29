'use client'

import { useState } from 'react'
import { useCurrency } from '@/contexts/CurrencyContext'
import CurrencySelector from '@/components/CurrencySelector'
import { useNotifications } from '@/contexts/NotificationContext'
import { importProducts } from '@/actions/products'
import { getErrorMessage } from '@/actions/http'
import { downloadCsvTemplate, productImportTemplateCsv } from '@/lib/import-templates'
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { type ImportApiResponse, type ImportResultSummary } from '@/types/import'

export default function ProductImport() {
  const { addNotification } = useNotifications()
  const { currentCurrency } = useCurrency()
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResultSummary | null>(null)
  const [showErrors, setShowErrors] = useState(false)
  const [apiResponse, setApiResponse] = useState<ImportApiResponse | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile)
      setResult(null)
    } else {
      addNotification({
        type: 'error',
        title: 'Invalid File',
        message: 'Please select a valid CSV file'
      })
    }
  }

  const handleImport = async () => {
    if (!file) return

    setImporting(true)
    setResult(null)

    try {
      const data: ImportApiResponse = await importProducts(file)
      setResult(data.summary)
      setApiResponse(data)
      addNotification({
        type: 'success',
        title: 'Import Successful',
        message: `Imported ${data.summary.success} products successfully in ${currentCurrency?.code}`
      })
    } catch (error) {
      console.error('Import error:', error)
      addNotification({
        type: 'error',
        title: 'Import Error',
        message: getErrorMessage(error, 'An error occurred during import')
      })
    } finally {
      setImporting(false)
    }
  }

  const downloadTemplate = () => {
    downloadCsvTemplate('product-import-template.csv', productImportTemplateCsv)
  }

  const clearFile = () => {
    setFile(null)
    setResult(null)
    setShowErrors(false)
    setApiResponse(null)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Bulk Product Import</h3>
          <p className="text-sm text-gray-600">
            Import multiple products at once using a CSV file
          </p>
        </div>
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Download Template
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-blue-800">Current Currency</h3>
            <p className="text-sm text-blue-600">
              {currentCurrency?.name} ({currentCurrency?.code}) - {currentCurrency?.symbol}
            </p>
          </div>
          <CurrencySelector />
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Important Note</h3>
            <div className="mt-2 text-sm text-yellow-700">
              <p>All prices in your CSV file must be in MMK (Myanmar Kyat). The system will store all prices in MMK as the base currency, regardless of what currency is currently selected above.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {!file ? (
          <div>
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="text-blue-600 hover:text-blue-500 font-medium">
                  Upload a CSV file
                </span>
                <span className="text-gray-500"> or drag and drop</span>
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                className="sr-only"
                onChange={handleFileChange}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              CSV files only. Max 10,000 products per import.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <DocumentArrowDownIcon className="h-5 w-5 text-green-500 mr-2" />
              <span className="text-sm font-medium text-gray-900">{file.name}</span>
              <span className="text-sm text-gray-500 ml-2">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
            <button
              onClick={clearFile}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>

      {file && (
        <div className="mt-4">
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {importing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <CloudArrowUpIcon className="h-4 w-4 mr-2" />
                Import {file.name}
              </>
            )}
          </button>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Import Results</h4>
          
                     <div className="grid grid-cols-3 gap-4 mb-4">
             <div className="text-center">
               <div className="text-2xl font-bold text-green-600">{result.success}</div>
               <div className="text-xs text-gray-500">Successful</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-red-600">{result.errors}</div>
               <div className="text-xs text-gray-500">Errors</div>
             </div>
             <div className="text-center">
               <div className="text-2xl font-bold text-blue-600">{result.total}</div>
               <div className="text-xs text-gray-500">Total</div>
             </div>
           </div>

                     {result.errors && result.errors > 0 && (
             <div>
               <button
                 onClick={() => setShowErrors(!showErrors)}
                 className="text-sm text-blue-600 hover:text-blue-500"
               >
                 {showErrors ? 'Hide' : 'Show'} {result.errors} errors
               </button>
               
               {showErrors && apiResponse?.errors && (
                 <div className="mt-2 max-h-32 overflow-y-auto">
                   {apiResponse.errors.map((error: string, index: number) => (
                     <div key={index} className="text-xs text-red-600 mb-1">
                       {error}
                     </div>
                   ))}
                 </div>
               )}
             </div>
           )}
        </div>
      )}
    </div>
  )
}
