'use client'

import Link from 'next/link'
import { AlertTriangle, RotateCcw, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function TenderDetailError({ error, reset }) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 頂部品牌漸層條 */}
      <div className="h-1 bg-gradient-to-r from-bes-blue-600 via-bes-blue-500 to-bes-green-500" />

      <div className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 py-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mb-2 text-xl font-bold font-heading text-bes-blue-900">無法載入標案詳情</h2>
          <p className="mb-6 text-sm text-slate-500">
            {error?.message || '載入標案資料時發生錯誤，請稍後再試'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" asChild className="cursor-pointer">
              <Link href="/gcc-tender">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回列表
              </Link>
            </Button>
            <Button
              onClick={reset}
              className="cursor-pointer bg-bes-blue-600 hover:bg-bes-blue-700"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              重新載入
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
