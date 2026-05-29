'use client'

import { useState } from 'react'
import { useNotifications } from '@/contexts/NotificationContext'
import { importCategories } from '@/actions/categories'
import { getErrorMessage } from '@/actions/http'
import { downloadCsvTemplate, categoryImportTemplateCsv } from '@/lib/import-templates'
import { 
  CloudArrowUpIcon, 
  DocumentArrowDownIcon,
  XMarkIcon 
} from '@heroicons/react/24/outline'
import { type ImportApiResponse, type ImportResultSummary } from '@/types/import'

export default function CategoryImport() {
  const { addNotification } = useNotifications()
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
      const data: ImportApiResponse = await importCategories(file)
      setResult(data.summary)
      setApiResponse(data)
      addNotification({
        type: 'success',
        title: 'Import Successful',
        message: `Imported ${data.summary.success} categories successfully`
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
    downloadCsvTemplate('categories-import-template.csv', categoryImportTemplateCsv)
  }

  const clearFile = () => {
    setFile(null)
    setResult(null)
    setShowErrors(false)
    setApiResponse(null)
  }

  return (
    <div className="space-y-4">
      {/* 1. Bulk Category Import Header - Mobile Optimized */}
      <div className="text-center sm:text-left">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Bulk Category Import</h3>
        <p className="text-sm text-gray-600 leading-relaxed">
          Import multiple categories at once using a CSV file
        </p>
      </div>

      {/* 2. Download Template Button - Mobile Optimized */}
      <div className="flex justify-center sm:justify-start">
        <button
          onClick={downloadTemplate}
          className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors shadow-sm"
        >
          <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
          Download Template
        </button>
      </div>

      {/* 3. Import Functionality - Mobile Optimized */}
      <div className="space-y-4">
        {/* Import Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Import Guidelines</h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Existing categories will be updated with new descriptions</p>
                <p>• New categories will be created with unique IDs</p>
                <p>• All categories are user-scoped for data isolation</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
          {!file ? (
            <div className="space-y-3">
              <CloudArrowUpIcon className="mx-auto h-10 w-10 text-gray-400" />
              <div>
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-500 font-medium text-sm">
                    Upload a CSV file
                  </span>
                  <span className="text-gray-500 text-sm"> or drag and drop</span>
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
              <p className="text-xs text-gray-500">
                CSV files only. Max 1,000 categories per import.
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center flex-1 min-w-0">
                <DocumentArrowDownIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="ml-3 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>

        {/* Import Button */}
        {file && (
          <div>
            <button
              onClick={handleImport}
              disabled={importing}
              className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
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

        {/* Import Results */}
        {result && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h4 className="text-sm font-medium text-gray-900 text-center">Import Results</h4>
            
            {/* Results Grid - Mobile Optimized */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">{result.success}</div>
                <div className="text-xs text-gray-500">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-red-600">{result.errors}</div>
                <div className="text-xs text-gray-500">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">{result.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>

            {/* Error Details */}
            {result.errors && result.errors > 0 && (
              <div className="text-center">
                <button
                  onClick={() => setShowErrors(!showErrors)}
                  className="text-sm text-blue-600 hover:text-blue-500 font-medium"
                >
                  {showErrors ? 'Hide' : 'Show'} {result.errors} errors
                </button>
                
                {showErrors && apiResponse?.errors && (
                  <div className="mt-3 max-h-32 overflow-y-auto bg-white rounded border p-3">
                    <div className="text-xs text-red-600 space-y-1 text-left">
                      {apiResponse.errors.map((error: string, index: number) => (
                        <div key={index} className="p-2 bg-red-50 rounded border-l-2 border-red-200">
                          {error}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
