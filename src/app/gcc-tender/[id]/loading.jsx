'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'

function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse rounded bg-bes-blue-100/60 ${className}`} />
}

export default function TenderDetailLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* 頂部品牌漸層條 */}
      <div className="h-1 bg-gradient-to-r from-bes-blue-600 via-bes-blue-500 to-bes-green-500" />

      <div className="container mx-auto space-y-6 px-4 py-6">
        {/* 返回按鈕 */}
        <SkeletonPulse className="h-9 w-24" />

        {/* 摘要卡片 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2 flex-1">
                <SkeletonPulse className="h-6 w-3/4" />
                <SkeletonPulse className="h-4 w-48" />
              </div>
              <div className="flex gap-2">
                <SkeletonPulse className="h-6 w-16" />
                <SkeletonPulse className="h-6 w-20" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-lg bg-bes-blue-50/50 p-3">
                  <div className="flex items-start gap-3">
                    <SkeletonPulse className="h-5 w-5 mt-0.5" />
                    <div className="space-y-2 flex-1">
                      <SkeletonPulse className="h-3 w-16" />
                      <SkeletonPulse className="h-4 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 詳細資料 */}
        <Card>
          <CardHeader>
            <SkeletonPulse className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <SkeletonPulse key={i} className="h-9 w-20" />
              ))}
            </div>
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => (
                <SkeletonPulse key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
