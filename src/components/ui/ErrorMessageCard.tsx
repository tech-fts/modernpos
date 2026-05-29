import React from 'react'
import Card from './Card'

interface ErrorMessageCardProps {
  message: React.ReactNode
  title?: string
  className?: string
}

export default function ErrorMessageCard({
  message,
  title = 'Error',
  className = ''
}: ErrorMessageCardProps) {
  return (
    <Card className={`bg-red-50 border-red-200 ${className}`.trim()}>
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 sm:text-base">{title}</h3>
          <div className="mt-2 text-sm text-red-700 sm:text-base">{message}</div>
        </div>
      </div>
    </Card>
  )
}
