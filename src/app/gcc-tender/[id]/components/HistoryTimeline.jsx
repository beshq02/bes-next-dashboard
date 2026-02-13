'use client'

import { useState } from 'react'
import { ExternalLink, History, Clock, ChevronDown, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { AnimatePresence, motion } from 'framer-motion'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Timeline,
  TimelineItem,
  TimelineIcon,
  TimelineConnector,
  TimelineContent,
  TimelineHeader,
} from '@/components/ui/timeline'

// ─── 變動比對邏輯 ────────────────────────────────────────────

// 在歷程中完全不顯示的欄位
const HISTORY_HIDDEN_FIELDS = new Set([
  'a01',      // 機關代碼
  'c02_01',   // 採購評選委員名單連結
  'd01_07',   // 投標須知下載連結
  'd01_08',   // 投標檔案名稱
  'd01_09',   // 投標檔案路徑
  'd01_10',   // Markdown 檔案路徑
  'd01_11',   // Markdown 轉換狀態
  'd01_12',   // Markdown 轉換時間
])

// 不追蹤變動的欄位（不顯示舊資料）
const HISTORY_NO_CHANGE_FIELDS = new Set([
  'c04',  // 新增公告傳輸次數
  'c05',  // 更正序號
  'c07',  // 公告日
  'c08',  // 原公告日
  'd03',  // 是否異動招標文件
])

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
    if (HISTORY_HIDDEN_FIELDS.has(field.field_code)) continue
    if (HISTORY_NO_CHANGE_FIELDS.has(field.field_code)) continue
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
          <p className="mt-1 text-slate-300">{change.oldVal}</p>
          <p className="mt-0.5">{change.newVal}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// ─── 單筆歷史記錄 ─────────────────────────────────────────

function HistoryEntry({ record, isLatest, isLast, announcementChanges, detailChanges }) {
  const [expanded, setExpanded] = useState(false)
  const hasChanges = announcementChanges.length > 0 || detailChanges.length > 0

  return (
    <TimelineItem>
      <div className="grid grid-cols-[auto_1fr] items-start gap-4">
        {/* 左側：圖標 + 連接線 */}
        <div className="flex flex-col items-center">
          <TimelineIcon
            icon={<Clock className="size-3.5" />}
            color={isLatest ? 'primary' : 'muted'}
            iconSize="sm"
            className="size-7"
          />
          {!isLast && (
            <TimelineConnector
              status="completed"
              className="mt-2 h-full min-h-8"
            />
          )}
        </div>

        {/* 右側：內容 */}
        <TimelineContent className="pb-2">
          {/* 摘要行 */}
          <TimelineHeader className="flex-wrap">
            <span className="flex items-center gap-1.5 text-sm font-medium text-bes-blue-800">
              {record.announcement_date ? format(new Date(record.announcement_date), 'yyyy年MM月dd日') : '未知日期'}
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
          </TimelineHeader>

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
        </TimelineContent>
      </div>
    </TimelineItem>
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
              <Timeline size="sm">
                {allRecords.map((record, index) => {
                  const isLatest = index === 0
                  const isLast = index === allRecords.length - 1
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
                      isLast={isLast}
                      announcementChanges={announcementChanges}
                      detailChanges={detailChanges}
                    />
                  )
                })}
              </Timeline>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}
