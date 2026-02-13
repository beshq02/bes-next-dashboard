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
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
// 招標類型配色（與表格列底色對應）
const TENDER_TYPE_TOGGLE_STYLES = {
  招標公告: {
    dot: 'bg-blue-400',
    active:
      'data-[state=on]:bg-blue-100 data-[state=on]:text-blue-700 data-[state=on]:border-blue-300',
  },
  公開閱覽: {
    dot: 'bg-violet-400',
    active:
      'data-[state=on]:bg-violet-100 data-[state=on]:text-violet-700 data-[state=on]:border-violet-300',
  },
  決標公告: {
    dot: 'bg-emerald-400',
    active:
      'data-[state=on]:bg-emerald-100 data-[state=on]:text-emerald-700 data-[state=on]:border-emerald-300',
  },
  無法決標: {
    dot: 'bg-rose-400',
    active:
      'data-[state=on]:bg-rose-100 data-[state=on]:text-rose-700 data-[state=on]:border-rose-300',
  },
}

// 級距顯示名稱對應（簡稱）
const RANGE_LABELS = {
  巨額: '巨額',
  查核金額以上未達巨額: '查核金額以上',
  公告金額以上未達查核金額: '公告金額以上',
  未達公告金額: '未達公告',
}

export default function TenderFilters({
  searchTerm,
  onSearchChange,
  procurementCategory,
  onProcurementCategoryChange,
  procurementCategories = [],
  procurementLevel,
  onProcurementLevelChange,
  tenderRanges = [],
  tenderTypeId,
  onTenderTypeChange,
  tenderTypes = [],
  budgetMin,
  onBudgetMinChange,
  dateRange,
  onDateRangeChange,
  onResetFilters,
}) {
  // 動態組合招標類型選項：tender_type（依 display_order，僅 if_display=true），多於一項時加「全部」
  const visibleTypes = tenderTypes
    .filter(t => t.if_display)
    .map(t => ({ value: String(t.id), label: t.type }))
  const typeOptions = [
    ...(visibleTypes.length > 1 ? [{ value: 'all', label: '全部' }] : []),
    ...visibleTypes,
  ]

  // 動態組合採購性質選項：proctrg_cate（依 display_order，僅 if_display=true），多於一項時加「全部」
  const visibleCategories = procurementCategories
    .filter(c => c.if_display)
    .map(c => ({ value: c.cate, label: c.cate }))
  const categoryOptions = [
    ...(visibleCategories.length > 1 ? [{ value: 'all', label: '全部' }] : []),
    ...visibleCategories,
  ]

  // 動態組合採購級距選項：tender_range（依 display_order，僅 if_display=true），多於一項時加「全部」
  const visibleRanges = tenderRanges
    .filter(r => r.if_display)
    .map(r => ({ value: r.range, label: RANGE_LABELS[r.range] || r.range }))
  const levelOptions = [
    ...(visibleRanges.length > 1 ? [{ value: 'all', label: '全部' }] : []),
    ...visibleRanges,
  ]

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
      return `${format(dateRange.from, 'yyyy年MM月dd日')} - ${format(dateRange.to, 'yyyy年MM月dd日')}`
    }
    if (dateRange.from) {
      return `${format(dateRange.from, 'yyyy年MM月dd日')} 起`
    }
    return `至 ${format(dateRange.to, 'yyyy年MM月dd日')}`
  }

  // 檢查是否有啟用的篩選（預設值不算啟用）
  const defaultCategory = visibleCategories.length > 0 ? visibleCategories[0].value : 'all'
  const defaultLevel = visibleRanges.length > 0 ? visibleRanges[0].value : 'all'
  const hasActiveFilters =
    searchTerm ||
    procurementCategory !== defaultCategory ||
    procurementLevel !== defaultLevel ||
    tenderTypeId !== 'all' ||
    dateRange.from ||
    dateRange.to ||
    budgetMin

  return (
    <div className="space-y-4 rounded-lg border border-bes-blue-100 bg-white p-4">
      {/* 第一行：搜尋框 */}
      <div className="relative">
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

      {/* 第二行：公告日期篩選 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="whitespace-nowrap text-sm text-slate-500">公告日期：</span>
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

      {/* 第三行：招標類型篩選 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="whitespace-nowrap text-sm text-slate-500">招標類型：</span>
        <ToggleGroup
          type="single"
          value={tenderTypeId}
          onValueChange={value => value && onTenderTypeChange(value)}
          className="flex-wrap"
        >
          {typeOptions.map(type => {
            const style = TENDER_TYPE_TOGGLE_STYLES[type.label]
            return (
              <ToggleGroupItem
                key={type.value}
                value={type.value}
                aria-label={type.label}
                className={cn(
                  'cursor-pointer border',
                  style
                    ? style.active
                    : 'data-[state=on]:bg-bes-blue-600 data-[state=on]:text-white'
                )}
              >
                {style && <span className={cn('inline-block size-2.5 rounded-full', style.dot)} />}
                {type.label}
              </ToggleGroupItem>
            )
          })}
        </ToggleGroup>
      </div>

      {/* 第三行：採購性質篩選 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <span className="whitespace-nowrap text-sm text-slate-500">採購性質：</span>
        <ToggleGroup
          type="single"
          value={procurementCategory}
          onValueChange={value => value && onProcurementCategoryChange(value)}
          className="flex-wrap"
        >
          {categoryOptions.map(cat => (
            <ToggleGroupItem
              key={cat.value}
              value={cat.value}
              aria-label={cat.label}
              className="cursor-pointer data-[state=on]:bg-bes-blue-600 data-[state=on]:text-white"
            >
              {cat.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      {/* 第四行：採購級距篩選 + 自訂預算 + 重設按鈕 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="whitespace-nowrap text-sm text-slate-500">採購級距：</span>
          <ToggleGroup
            type="single"
            value={procurementLevel}
            onValueChange={value => value && onProcurementLevelChange(value)}
            className="flex-wrap"
          >
            {levelOptions.map(level => (
              <ToggleGroupItem
                key={level.value}
                value={level.value}
                aria-label={level.label}
                className="cursor-pointer data-[state=on]:bg-bes-blue-600 data-[state=on]:text-white"
              >
                {level.label}
              </ToggleGroupItem>
            ))}
            <ToggleGroupItem
              value="custom"
              aria-label="自訂"
              className="cursor-pointer data-[state=on]:bg-bes-blue-600 data-[state=on]:text-white"
            >
              自訂
            </ToggleGroupItem>
          </ToggleGroup>
          {procurementLevel === 'custom' && (
            <InputGroup className="w-40">
              <InputGroupAddon>
                <InputGroupText>NT$</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                type="number"
                min="0"
                step="1"
                placeholder="20"
                value={budgetMin ?? ''}
                onKeyDown={e => { if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault() }}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '')
                  onBudgetMinChange(v ? Number(v) : null)
                }}
                className="text-right [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>億 以上</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
          )}
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
    </div>
  )
}
