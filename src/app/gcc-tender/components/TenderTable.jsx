'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ArrowUpDown, ArrowUp, ArrowDown, ExternalLink, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from '@/components/ui/pagination'
import { formatBudget, getProcurementLevelBadge } from '../lib/utils'

// 排序圖示
function SortIcon({ column, sortConfig }) {
  if (sortConfig.key !== column) {
    return <ArrowUpDown className="ml-1 h-4 w-4 text-slate-300" />
  }
  return sortConfig.direction === 'asc' ? (
    <ArrowUp className="ml-1 h-4 w-4 text-bes-blue-600" />
  ) : (
    <ArrowDown className="ml-1 h-4 w-4 text-bes-blue-600" />
  )
}

// 表頭元件
function SortableHeader({ column, label, sortConfig, onSort, className }) {
  return (
    <TableHead className={className}>
      <button
        onClick={() => onSort(column)}
        className="flex cursor-pointer items-center transition-colors hover:text-bes-blue-600"
      >
        {label}
        <SortIcon column={column} sortConfig={sortConfig} />
      </button>
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
}) {
  const router = useRouter()

  const handleRowClick = item => {
    router.push(`/gcc-tender/${item.id}`)
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
        <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="mb-2 text-lg font-medium font-heading text-bes-blue-900">沒有找到符合的標案</h3>
        <p className="text-sm text-slate-500">請嘗試調整篩選條件</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      {/* 表格資訊列 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <span className="text-sm text-slate-600">
          共 <span className="font-medium font-heading text-bes-blue-900">{totalCount}</span> 筆標案
        </span>
        <span className="text-sm text-slate-500">
          第 {currentPage} / {totalPages} 頁
        </span>
      </div>

      {/* 表格 */}
      <div className="overflow-x-auto">
        <TooltipProvider>
          <Table>
            <TableHeader>
              <TableRow className="bg-bes-blue-50/50 hover:bg-bes-blue-50/50">
                <SortableHeader
                  column="tender_name"
                  label="標案名稱"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  className="min-w-[300px]"
                />
                <SortableHeader
                  column="org_name"
                  label="機關名稱"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  className="min-w-[180px]"
                />
                <SortableHeader
                  column="announcement_date"
                  label="公告日期"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  className="min-w-[110px]"
                />
                <TableHead className="min-w-[100px]">截止日期</TableHead>
                <SortableHeader
                  column="budget"
                  label="預算金額"
                  sortConfig={sortConfig}
                  onSort={onSort}
                  className="min-w-[120px] text-right"
                />
                <TableHead className="min-w-[100px]">採購級距</TableHead>
                <TableHead className="min-w-[100px]">招標方式</TableHead>
                <TableHead className="w-[80px]">操作</TableHead>
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
                {data.map(item => (
                  <TableRow
                    key={item.id}
                    onClick={() => handleRowClick(item)}
                    className="cursor-pointer transition-colors hover:bg-bes-blue-50/30"
                  >
                    <TableCell className="font-medium">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-2">
                            <span className="line-clamp-2">{item.tender_name || '-'}</span>
                            {item.history_count > 1 && (
                              <Badge variant="secondary" className="shrink-0 text-xs">
                                {item.history_count} 次公告
                              </Badge>
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-md">
                          <p>{item.tender_name}</p>
                          {item.tender_no && (
                            <p className="mt-1 text-xs text-slate-400">案號：{item.tender_no}</p>
                          )}
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{item.org_name || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm tabular-nums">
                        {item.announcement_date
                          ? format(new Date(item.announcement_date), 'yyyy/MM/dd')
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{item.deadline || '-'}</span>
                    </TableCell>
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
                    <TableCell>{getProcurementLevelBadge(item.procurement_level)}</TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600">{item.tender_method || '-'}</span>
                    </TableCell>
                    <TableCell>
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
                              className="h-8 w-8 cursor-pointer"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>開啟政府採購網</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
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
