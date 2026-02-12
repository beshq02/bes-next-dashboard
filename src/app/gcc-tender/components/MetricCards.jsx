'use client'

import { useMemo } from 'react'
import { parseISO, isThisWeek } from 'date-fns'
import { FileText, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import { motion } from 'framer-motion'
import NumberFlow from '@number-flow/react'

import { Card, CardContent } from '@/components/ui/card'
import { formatAmount } from '../lib/utils'
import { staggerContainer, staggerItem } from '../lib/animations'

// 計算統計數據
function useMetrics(data, filteredData) {
  return useMemo(() => {
    const totalCount = data.length
    const filteredCount = filteredData.length

    const hugeCount = data.filter(item => item.procurement_level === '巨額').length
    const filteredHugeCount = filteredData.filter(item => item.procurement_level === '巨額').length

    const thisWeekCount = data.filter(item => {
      if (!item.announcement_date) return false
      try {
        const date = parseISO(item.announcement_date)
        return isThisWeek(date, { weekStartsOn: 1 })
      } catch (_e) {
        return false
      }
    }).length

    const totalBudget = filteredData.reduce((sum, item) => {
      if (!item.budget) return sum
      const num = parseFloat(String(item.budget).replace(/,/g, ''))
      return isNaN(num) ? sum : sum + num
    }, 0)

    return { totalCount, filteredCount, hugeCount, filteredHugeCount, thisWeekCount, totalBudget }
  }, [data, filteredData])
}

// 單一指標卡片
function MetricCard({ icon: Icon, label, value, subValue, iconBg, iconColor, borderColor }) {
  return (
    <motion.div variants={staggerItem}>
      <Card className={`border-l-4 ${borderColor} transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className={`rounded-lg p-3 ${iconBg}`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-slate-500">{label}</p>
              <div className="font-heading text-2xl font-bold tabular-nums text-bes-blue-950">
                {typeof value === 'number' ? (
                  <NumberFlow value={value} />
                ) : (
                  value
                )}
              </div>
              {subValue && <p className="mt-0.5 text-xs text-slate-400">{subValue}</p>}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function MetricCards({ data = [], filteredData = [] }) {
  const metrics = useMetrics(data, filteredData)
  const isFiltered = filteredData.length !== data.length

  return (
    <motion.div
      className="grid grid-cols-2 gap-4 lg:grid-cols-4"
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {/* 總標案數 */}
      <MetricCard
        icon={FileText}
        label={isFiltered ? '篩選結果' : '總標案數'}
        value={metrics.filteredCount}
        subValue={isFiltered ? `共 ${metrics.totalCount} 筆` : null}
        iconBg="bg-bes-blue-50"
        iconColor="text-bes-blue-600"
        borderColor="border-bes-blue-500"
      />

      {/* 巨額標案 */}
      <MetricCard
        icon={TrendingUp}
        label="巨額標案"
        value={isFiltered ? metrics.filteredHugeCount : metrics.hugeCount}
        subValue={
          isFiltered && metrics.filteredHugeCount !== metrics.hugeCount
            ? `共 ${metrics.hugeCount} 筆`
            : null
        }
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        borderColor="border-amber-500"
      />

      {/* 本週新增 */}
      <MetricCard
        icon={Calendar}
        label="本週新增"
        value={metrics.thisWeekCount}
        subValue="依公告日期"
        iconBg="bg-bes-green-50"
        iconColor="text-bes-green-600"
        borderColor="border-bes-green-500"
      />

      {/* 預算總額 */}
      <MetricCard
        icon={DollarSign}
        label={isFiltered ? '篩選預算總額' : '預算總額'}
        value={formatAmount(metrics.totalBudget)}
        subValue="NT$"
        iconBg="bg-bes-blue-50"
        iconColor="text-bes-blue-500"
        borderColor="border-bes-blue-400"
      />
    </motion.div>
  )
}
