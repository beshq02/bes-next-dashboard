'use client'

import { useState } from 'react'
import { ExternalLink, History, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// ─── 變動比對邏輯 ────────────────────────────────────────────

const TRACKED_ANNOUNCEMENT_FIELDS = [
  { key: 'org_name', label: '機關名稱' },
  { key: 'announcement_date', label: '公告日期' },
  { key: 'deadline', label: '截止日期' },
  { key: 'budget', label: '預算金額' },
  { key: 'tender_method', label: '招標方式' },
  { key: 'procurement_nature', label: '採購性質' },
  { key: 'tender_no', label: '案號' },
  { key: 'is_correction', label: '是否更正' },
  { key: 'transmission_count', label: '傳輸次數' },
]

const CATEGORY_NAMES = {
  A: '機關資料',
  B: '採購資料',
  C: '招標資料',
  D: '領投開標資料',
  E: '其他資料',
}

function getAnnouncementChanges(current, previous) {
  const changes = []
  for (const f of TRACKED_ANNOUNCEMENT_FIELDS) {
    const curr = current[f.key]
    const prev = previous[f.key]
    if (curr == null && prev == null) continue
    if (String(curr ?? '') !== String(prev ?? '')) {
      changes.push({
        key: f.key,
        label: f.label,
        oldVal: String(prev ?? '-'),
        newVal: String(curr ?? '-'),
      })
    }
  }
  return changes
}

function getDetailChanges(currentDetail, previousDetail, fieldMapping) {
  if (!currentDetail && !previousDetail) return []
  if (!currentDetail || !previousDetail) {
    return currentDetail && !previousDetail
      ? [{ key: '_detail_added', label: '詳細資料', oldVal: '（無）', newVal: '（新增）' }]
      : [{ key: '_detail_removed', label: '詳細資料', oldVal: '（有）', newVal: '（已移除）' }]
  }

  const changes = []
  for (const field of fieldMapping) {
    const currVal = currentDetail[field.field_code]
    const prevVal = previousDetail[field.field_code]
    if ((currVal == null || currVal === '') && (prevVal == null || prevVal === '')) continue
    if (String(currVal ?? '') !== String(prevVal ?? '')) {
      changes.push({
        key: field.field_code,
        label: `[${CATEGORY_NAMES[field.category] || field.category}] ${field.field_name}`,
        oldVal: String(prevVal ?? '-'),
        newVal: String(currVal ?? '-'),
      })
    }
  }
  return changes
}

// ─── 單筆變動細節（truncated） ───────────────────────────────

function ChangeLine({ change }) {
  const fullText = `${change.oldVal} → ${change.newVal}`

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-xs leading-relaxed">
            <span className="font-medium">{change.label}</span>{' '}
            <span className="line-clamp-1 inline-block max-w-[300px] align-bottom text-slate-500">
              {fullText}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-sm whitespace-pre-wrap">
          <p className="font-medium">{change.label}</p>
          <p className="mt-1 text-slate-300 line-through">{change.oldVal}</p>
          <p className="mt-0.5">{change.newVal}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── 單筆歷史記錄 ─────────────────────────────────────────

function HistoryEntry({ record, isLatest, announcementChanges, detailChanges }) {
  const [expanded, setExpanded] = useState(false)
  const hasChanges = announcementChanges.length > 0 || detailChanges.length > 0

  return (
    <div className="relative pl-10 pb-4 last:pb-0">
      {/* Timeline dot */}
      <div
        className={`absolute left-2 top-1.5 h-3 w-3 rounded-full border-2 ${
          isLatest
            ? 'border-bes-blue-500 bg-bes-blue-500'
            : 'border-slate-300 bg-white'
        }`}
      />

      <div className="space-y-1">
        {/* 摘要行 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1.5 text-sm font-medium text-bes-blue-800">
            <Clock className="h-3.5 w-3.5" />
            {record.announcement_date || '未知日期'}
          </span>
          {isLatest && (
            <Badge className="bg-bes-blue-500 text-white">最新</Badge>
          )}
          {record.is_correction && (
            <Badge variant="outline" className="border-amber-300 text-amber-600">更正公告</Badge>
          )}
          {record.detail_url && (
            <a
              href={record.detail_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-bes-blue-600 hover:underline"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        {/* 變動計數摘要 */}
        {hasChanges ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              {announcementChanges.length > 0 && (
                <span>{announcementChanges.length} 項公告變動</span>
              )}
              {announcementChanges.length > 0 && detailChanges.length > 0 && (
                <span> · </span>
              )}
              {detailChanges.length > 0 && (
                <span>{detailChanges.length} 項詳細變動</span>
              )}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setExpanded(prev => !prev)}
              className="h-6 cursor-pointer px-2 text-xs text-bes-blue-600 hover:bg-bes-blue-50 hover:text-bes-blue-700"
            >
              {expanded ? <ChevronDown className="mr-1 h-3 w-3" /> : <ChevronRight className="mr-1 h-3 w-3" />}
              {expanded ? '收合' : '查看變動'}
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">首次公告</span>
        )}

        {/* 展開的變動細節 */}
        <AnimatePresence>
          {expanded && hasChanges && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-2 space-y-2">
                {announcementChanges.length > 0 && (
                  <div className="rounded-md bg-amber-50 px-3 py-2">
                    <p className="mb-1.5 text-xs font-medium text-amber-700">
                      公告變動：{announcementChanges.map(c => c.label).join('、')}
                    </p>
                    <div className="space-y-0.5">
                      {announcementChanges.map(change => (
                        <ChangeLine key={change.key} change={change} />
                      ))}
                    </div>
                  </div>
                )}

                {detailChanges.length > 0 && (
                  <div className="rounded-md bg-bes-blue-50 px-3 py-2">
                    <p className="mb-1.5 text-xs font-medium text-bes-blue-700">
                      詳細變動：{detailChanges.slice(0, 5).map(c => c.label.replace(/\[.*?\]\s*/, '')).join('、')}
                      {detailChanges.length > 5 && '...'}
                    </p>
                    <div className="space-y-0.5">
                      {detailChanges.map(change => (
                        <ChangeLine key={change.key} change={change} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ─── 主元件 ───────────────────────────────────────────────

export default function HistoryTimeline({ history, currentAnnouncement, detailMap, fieldMapping }) {
  const [timelineOpen, setTimelineOpen] = useState(false)

  if (!history || history.length === 0) return null

  const allRecords = [currentAnnouncement, ...history]

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setTimelineOpen(prev => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-bes-blue-500" />
            <CardTitle className="font-heading">公告歷程</CardTitle>
            <Badge variant="secondary">{allRecords.length} 次公告</Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 cursor-pointer">
            <ChevronDown
              className={`h-4 w-4 text-slate-500 transition-transform duration-200 ${
                timelineOpen ? 'rotate-180' : ''
              }`}
            />
          </Button>
        </div>
      </CardHeader>

      <AnimatePresence>
        {timelineOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <CardContent className="pt-0">
              <div className="relative space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-bes-blue-500 to-bes-green-400" />

                {allRecords.map((record, index) => {
                  const isLatest = index === 0
                  const previousRecord = index < allRecords.length - 1 ? allRecords[index + 1] : null
                  const announcementChanges = previousRecord ? getAnnouncementChanges(record, previousRecord) : []
                  const detailChanges = previousRecord
                    ? getDetailChanges(detailMap[record.id] || null, detailMap[previousRecord.id] || null, fieldMapping)
                    : []

                  return (
                    <HistoryEntry
                      key={record.id}
                      record={record}
                      isLatest={isLatest}
                      announcementChanges={announcementChanges}
                      detailChanges={detailChanges}
                    />
                  )
                })}
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
