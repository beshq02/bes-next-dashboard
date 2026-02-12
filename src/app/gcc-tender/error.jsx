'use client'

import { AlertTriangle, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function GccTenderError({ error, reset }) {
  return (
    <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="mb-2 text-xl font-bold font-heading text-bes-blue-900">載入失敗</h2>
        <p className="mb-6 text-sm text-slate-500">
          {error?.message || '無法載入標案資料，請稍後再試'}
        </p>
        <Button
          onClick={reset}
          className="cursor-pointer bg-bes-blue-600 hover:bg-bes-blue-700"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          重新載入
        </Button>
      </div>
    </div>
  )
}
