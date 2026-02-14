'use client'

import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUp, FileText, ArrowDown, ArrowUpDown, ExternalLink, Eye, Loader2, Bookmark } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableRow, TableCell, TableHead, TableHeader } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import {
  Pagination,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationContent,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'

import { formatBudget, getTenderTypeRowStyle } from '../lib/utils'

// 拖曳調整寬度的 handle
function ResizeHandle({ onResize }) {
  const handleMouseDown = useCallback(
    e => {
      e.preventDefault()
      e.stopPropagation()
      const startX = e.clientX
      const th = e.target.closest('th')
      const startWidth = th.offsetWidth

      const onMouseMove = ev => {
        const newWidth = Math.max(60, startWidth + ev.clientX - startX)
        onResize(newWidth)
      }
      const onMouseUp = () => {
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }
      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    },
    [onResize]
  )

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-1/2 h-4 w-[3px] -translate-y-1/2 cursor-col-resize rounded-full bg-slate-300 transition-colors hover:bg-bes-blue-500 active:bg-bes-blue-600"
    />
  )
}

// 排序圖示
function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="ml-1 size-4 text-slate-300" />
  }
  return sortConfig.direction === 'asc' ? (
    <ArrowUp className="ml-1 size-4 text-bes-blue-600" />
  ) : (
    <ArrowDown className="ml-1 size-4 text-bes-blue-600" />
  )
}

// 表頭元件（含 resize handle）
function SortableHeader({ column, label, sortConfig, onSort, width, onResize, className }) {
  return (
    <TableHead className={cn('relative', className)} style={width ? { width } : undefined}>
      <button
        onClick={() => onSort(column)}
        className="flex cursor-pointer items-center transition-colors hover:text-bes-blue-600"
      >
        {label}
        <SortIcon column={column} sortConfig={sortConfig} />
      </button>
      {onResize && <ResizeHandle onResize={onResize} />}
    </TableHead>
  )
}

// 一般表頭（含 resize handle）
function ResizableHead({ children, width, onResize, className }) {
  return (
    <TableHead className={cn('relative', className)} style={width ? { width } : undefined}>
      {children}
      {onResize && <ResizeHandle onResize={onResize} />}
    </TableHead>
  )
}

// 分頁元件
function TablePagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const getPageNumbers = () => {
    const pages = []
    const showPages = 5
    let start = Math.max(1, currentPage - Math.floor(showPages / 2))
    let end = Math.min(totalPages, start + showPages - 1)

    if (end - start + 1 < showPages) {
      start = Math.max(1, end - showPages + 1)
    }

    if (start > 1) {
      pages.push(1)
      if (start > 2) pages.push('ellipsis-start')
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('ellipsis-end')
      pages.push(totalPages)
    }

    return pages
  }

  return (
    <Pagination className="mt-4">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={cn('cursor-pointer', currentPage === 1 && 'pointer-events-none opacity-50')}
          />
        </PaginationItem>

        {getPageNumbers().map((page, index) => (
          <PaginationItem key={`${page}-${index}`}>
            {page === 'ellipsis-start' || page === 'ellipsis-end' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page)}
                isActive={currentPage === page}
                className={cn(
                  'cursor-pointer',
                  currentPage === page && 'bg-bes-blue-600 text-white hover:bg-bes-blue-700'
                )}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={cn(
              'cursor-pointer',
              currentPage === totalPages && 'pointer-events-none opacity-50'
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}

export default function TenderTable({
  data = [],
  totalCount = 0,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  sortConfig,
  onSort,
  favorites = new Set(),
  onToggleFavorite,
}) {
  const router = useRouter()

  // 欄位寬度狀態（可拖曳調整）
  const [colWidths, setColWidths] = useState({
    index: 50,
    tender_no: 140,
    tender_name: 300,
    org_name: 180,
    tender_method: 100,
    announcement_date: 110,
    deadline: 100,
    review_period: 200,
    budget: 120,
    action: 120,
  })

  const handleColResize = useCallback((col, width) => {
    setColWidths(prev => ({ ...prev, [col]: width }))
  }, [])

  // 動態判斷哪些欄位有資料，全空則隱藏
  const visibleCols = useMemo(() => {
    const has = key => data.some(item => item[key] != null && item[key] !== '')
    return {
      tender_no: has('tender_no'),
      tender_name: true, // 必顯示
      org_name: has('org_name'),
      tender_method: has('tender_method'),
      announcement_date: has('announcement_date'),
      deadline: has('deadline'),
      review_period: data.some(item => item.review_start_date && item.review_end_date),
      budget: has('budget'),
      action: true,
    }
  }, [data])

  const [loadingId, setLoadingId] = useState(null)

  const getDetailPath = item => {
    if (item.source_type === 'tender') return `/gcc-tender/${item.id}`
    if (item.source_type === 'tpread') return `/gcc-tender/tpread/${item.id}`
    if (item.source_type === 'award') return `/gcc-tender/award/${item.id}`
    return null
  }

  const handleView = async (e, item) => {
    e.stopPropagation()
    const path = getDetailPath(item)
    if (!path) return
    setLoadingId(item.id)
    await router.prefetch(path)
    router.push(path)
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto mb-4 size-12 text-slate-300" />
        <h3 className="mb-2 font-heading text-lg font-medium text-bes-blue-900">
          沒有找到符合的標案
        </h3>
        <p className="text-sm text-slate-500">請嘗試調整篩選條件</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* 表格資訊列 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-sm text-slate-600">
          共 <span className="font-heading font-medium text-bes-blue-900">{totalCount}</span> 筆標案
        </span>
        <span className="text-sm text-slate-500">
          第 {currentPage} / {totalPages} 頁
        </span>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <TooltipProvider>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className="bg-bes-blue-50/50 hover:bg-bes-blue-50/50">
                <ResizableHead
                  width={colWidths.index}
                  onResize={w => handleColResize('index', w)}
                  className="text-center"
                >
                  #
                </ResizableHead>
                {visibleCols.tender_no && (
                  <ResizableHead
                    width={colWidths.tender_no}
                    onResize={w => handleColResize('tender_no', w)}
                  >
                    標案案號
                  </ResizableHead>
                )}
                <SortableHeader
                  column="tender_name"
                  label="標案名稱"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  width={colWidths.tender_name}
                  onResize={w => handleColResize('tender_name', w)}
                />
                {visibleCols.org_name && (
                  <SortableHeader
                    column="org_name"
                    label="機關名稱"
                    sortConfig={sortConfig}
                    onSort={onSort}
                    width={colWidths.org_name}
                    onResize={w => handleColResize('org_name', w)}
                  />
                )}
                {visibleCols.tender_method && (
                  <ResizableHead
                    width={colWidths.tender_method}
                    onResize={w => handleColResize('tender_method', w)}
                  >
                    招標方式
                  </ResizableHead>
                )}
                {visibleCols.announcement_date && (
                  <SortableHeader
                    column="announcement_date"
                    label="公告日期"
                    sortConfig={sortConfig}
                    onSort={onSort}
                    width={colWidths.announcement_date}
                    onResize={w => handleColResize('announcement_date', w)}
                  />
                )}
                {visibleCols.deadline && (
                  <ResizableHead
                    width={colWidths.deadline}
                    onResize={w => handleColResize('deadline', w)}
                  >
                    截止投標
                  </ResizableHead>
                )}
                {visibleCols.review_period && (
                  <ResizableHead
                    width={colWidths.review_period}
                    onResize={w => handleColResize('review_period', w)}
                  >
                    公開閱覽期間
                  </ResizableHead>
                )}
                {visibleCols.budget && (
                  <SortableHeader
                    column="budget"
                    label="預算金額"
                    sortConfig={sortConfig}
                    onSort={onSort}
                    width={colWidths.budget}
                    onResize={w => handleColResize('budget', w)}
                    className="text-right"
                  />
                )}
                {visibleCols.action && (
                  <TableHead className="relative" style={{ width: colWidths.action }}>
                    操作
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <AnimatePresence mode="wait">
              <motion.tbody
                key={currentPage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                {data.map((item, idx) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      'transition-colors',
                      getTenderTypeRowStyle(item.tender_type_name) || 'hover:bg-bes-blue-50/30'
                    )}
                  >
                    <TableCell className="text-center text-sm tabular-nums text-slate-500">
                      {(currentPage - 1) * 20 + idx + 1}
                    </TableCell>
                    {visibleCols.tender_no && (
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.tender_no || '-'}</span>
                      </TableCell>
                    )}
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <span className="line-clamp-2">{item.tender_name || '-'}</span>
                        {item.is_correction && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="shrink-0 cursor-default">🔄</span>
                            </TooltipTrigger>
                            <TooltipContent>更正公告</TooltipContent>
                          </Tooltip>
                        )}
                        {item.transmission_count > 1 && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            第 {item.transmission_count} 次公告
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {visibleCols.org_name && (
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.org_name || '-'}</span>
                      </TableCell>
                    )}
                    {visibleCols.tender_method && (
                      <TableCell>
                        <span className="text-sm text-slate-600">{item.tender_method || '-'}</span>
                      </TableCell>
                    )}
                    {visibleCols.announcement_date && (
                      <TableCell>
                        <span className="text-sm tabular-nums">
                          {item.announcement_date
                            ? format(new Date(item.announcement_date), 'yyyy年MM月dd日')
                            : '-'}
                        </span>
                      </TableCell>
                    )}
                    {visibleCols.deadline && (
                      <TableCell>
                        <span className="text-sm tabular-nums">
                          {item.deadline ? format(new Date(item.deadline), 'yyyy年MM月dd日') : '-'}
                        </span>
                      </TableCell>
                    )}
                    {visibleCols.review_period && (
                      <TableCell>
                        <span className="text-sm tabular-nums text-slate-600">
                          {item.review_start_date && item.review_end_date
                            ? (() => {
                                const s = new Date(item.review_start_date)
                                const e = new Date(item.review_end_date)
                                const sameYear = s.getFullYear() === e.getFullYear()
                                const sameMonth = sameYear && s.getMonth() === e.getMonth()
                                const endFmt = sameMonth
                                  ? 'dd日'
                                  : sameYear
                                    ? 'MM月dd日'
                                    : 'yyyy年MM月dd日'
                                return `${format(s, 'yyyy年MM月dd日')} ~ ${format(e, endFmt)}`
                              })()
                            : '-'}
                        </span>
                      </TableCell>
                    )}
                    {visibleCols.budget && (
                      <TableCell className="text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-sm font-medium tabular-nums">
                              {formatBudget(item.budget)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.budget ? `NT$ ${item.budget}` : '未提供'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                    )}
                    {visibleCols.action && (
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={e => {
                                  e.stopPropagation()
                                  onToggleFavorite?.(item.tender_no)
                                }}
                                className="size-8 cursor-pointer"
                              >
                                <Bookmark
                                  className={cn(
                                    'size-4 transition-colors',
                                    favorites.has(item.tender_no)
                                      ? 'fill-bes-blue-500 text-bes-blue-500'
                                      : 'text-slate-400 hover:text-bes-blue-400'
                                  )}
                                />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{favorites.has(item.tender_no) ? '取消收藏' : '加入收藏'}</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={loadingId === item.id}
                                onClick={e => handleView(e, item)}
                                className="size-8 cursor-pointer"
                              >
                                {loadingId === item.id ? (
                                  <Loader2 className="size-4 animate-spin" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>檢視詳細</p>
                            </TooltipContent>
                          </Tooltip>
                          {item.detail_url && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={e => {
                                    e.stopPropagation()
                                    window.open(item.detail_url, '_blank')
                                  }}
                                  className="size-8 cursor-pointer"
                                >
                                  <ExternalLink className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>開啟政府採購網</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </motion.tbody>
            </AnimatePresence>
          </Table>
        </TooltipProvider>
      </div>

      {/* 分頁 */}
      <div className="border-t border-slate-100 px-4 py-3">
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  )
}
