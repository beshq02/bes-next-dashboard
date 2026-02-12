'use client'

import { Card, CardContent } from '@/components/ui/card'

function SkeletonPulse({ className = '' }) {
  return <div className={`animate-pulse rounded bg-bes-blue-100/60 ${className}`} />
}

export default function GccTenderLoading() {
  return (
    <div className="container mx-auto space-y-6 px-4 py-6">
      {/* Header skeleton */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-bes-blue-600 via-bes-blue-500 to-bes-green-500 p-6">
        <SkeletonPulse className="mb-2 h-7 w-48 !bg-white/20" />
        <SkeletonPulse className="h-4 w-64 !bg-white/15" />
      </div>

      {/* MetricCards skeleton */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <SkeletonPulse className="h-11 w-11 !rounded-lg" />
                <div className="flex-1 space-y-2">
                  <SkeletonPulse className="h-3 w-16" />
                  <SkeletonPulse className="h-7 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters skeleton */}
      <div className="rounded-lg border border-bes-blue-100 bg-white p-4 space-y-4">
        <div className="flex gap-3">
          <SkeletonPulse className="h-10 flex-1" />
          <SkeletonPulse className="h-10 w-[280px]" />
        </div>
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => (
            <SkeletonPulse key={i} className="h-8 w-20" />
          ))}
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-slate-200 bg-white">
        <div className="border-b px-4 py-3">
          <SkeletonPulse className="h-4 w-32" />
        </div>
        <div className="p-4 space-y-3">
          {[...Array(8)].map((_, i) => (
            <SkeletonPulse key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
