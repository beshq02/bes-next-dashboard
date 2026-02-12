'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import { CalendarIcon, Search, X, RotateCcw } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Badge } from '@/components/ui/badge'

// 採購級距選項
const PROCUREMENT_LEVELS = [
  { value: 'all', label: '全部' },
  { value: '巨額', label: '巨額' },
  { value: '查核金額以上未達巨額', label: '查核金額以上' },
  { value: 'null', label: '未分類' },
]

export default function TenderFilters({
  searchTerm,
  onSearchChange,
  procurementLevel,
  onProcurementLevelChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
}) {
  // Debounce 搜尋輸入
  const [localSearch, setLocalSearch] = useState(searchTerm)

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearchChange])

  // 同步外部 searchTerm 變更
  useEffect(() => {
    setLocalSearch(searchTerm)
  }, [searchTerm])

  // 格式化日期範圍顯示
  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) {
      return '選擇日期範圍'
    }
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'yyyy/MM/dd')} - ${format(dateRange.to, 'yyyy/MM/dd')}`
    }
    if (dateRange.from) {
      return `${format(dateRange.from, 'yyyy/MM/dd')} 起`
    }
    return `至 ${format(dateRange.to, 'yyyy/MM/dd')}`
  }

  // 檢查是否有啟用的篩選
  const hasActiveFilters =
    searchTerm || procurementLevel !== 'all' || dateRange.from || dateRange.to

  return (
    <div className="space-y-4 rounded-lg border border-bes-blue-100 bg-white p-4">
      {/* 第一行：搜尋框 + 日期選擇器 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* 搜尋輸入框 */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="搜尋標案名稱、機關名稱、標案案號..."
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            className="pl-9 pr-9 focus-visible:ring-bes-blue-500"
          />
          {localSearch && (
            <button
              onClick={() => setLocalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* 日期範圍選擇器 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full cursor-pointer justify-start text-left font-normal sm:w-[280px]',
                !dateRange.from && !dateRange.to && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {formatDateRange()}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from || new Date()}
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={range => onDateRangeChange(range || { from: null, to: null })}
              numberOfMonths={2}
              locale={zhTW}
            />
            <div className="flex justify-end gap-2 border-t p-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDateRangeChange({ from: null, to: null })}
                className="cursor-pointer"
              >
                清除
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {/* 第二行：採購級距篩選 + 重設按鈕 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="whitespace-nowrap text-sm text-slate-500">採購級距：</span>
          <ToggleGroup
            type="single"
            value={procurementLevel}
            onValueChange={value => value && onProcurementLevelChange(value)}
            className="flex-wrap"
          >
            {PROCUREMENT_LEVELS.map(level => (
              <ToggleGroupItem
                key={level.value}
                value={level.value}
                aria-label={level.label}
                className="cursor-pointer data-[state=on]:bg-bes-blue-600 data-[state=on]:text-white"
              >
                {level.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        {/* 重設篩選按鈕 */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="cursor-pointer text-slate-500 hover:text-slate-700"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            重設篩選
          </Button>
        )}
      </div>

      {/* 已啟用的篩選標籤 */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 border-t border-bes-blue-50 pt-2">
          {searchTerm && (
            <Badge variant="secondary" className="gap-1 bg-bes-blue-50 text-bes-blue-700">
              搜尋：{searchTerm}
              <button onClick={() => onSearchChange('')} className="cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {procurementLevel !== 'all' && (
            <Badge variant="secondary" className="gap-1 bg-bes-blue-50 text-bes-blue-700">
              級距：{PROCUREMENT_LEVELS.find(l => l.value === procurementLevel)?.label}
              <button onClick={() => onProcurementLevelChange('all')} className="cursor-pointer">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="gap-1 bg-bes-blue-50 text-bes-blue-700">
              日期：{formatDateRange()}
              <button
                onClick={() => onDateRangeChange({ from: null, to: null })}
                className="cursor-pointer"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
