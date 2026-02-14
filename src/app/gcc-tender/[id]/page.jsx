import { notFound } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  ClockAlert,
  DollarSign,
  ExternalLink,
  FileText,
  Hash,
  Info,
  ClipboardList,
  Paperclip,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import InfoItem from '../components/shared/InfoItem'
import DetailCard from '../components/shared/DetailCard'
import ScreenshotProvider from '../components/shared/ScreenshotProvider'
import ScreenshotButton from '../components/shared/ScreenshotButton'
import { getProcurementLevelBadge, formatBudget } from '../lib/utils'

import FileList from '../components/shared/FileList'
import HistoryTimeline from './components/HistoryTimeline'
import DetailSection from './components/DetailSection'
import CommitteeTable from './components/CommitteeTable'

// ─── Data fetching ──────────────────────────────────────────────

async function getTenderAnnouncement(id) {
  const { data, error } = await supabase
    .from('gcc_tender_announcement')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('取得標案公告失敗:', error)
    return null
  }
  return data
}

async function getTenderHistory(tenderName, currentId) {
  if (!tenderName) return []

  const { data, error } = await supabase
    .from('gcc_tender_announcement')
    .select('*')
    .eq('tender_name', tenderName)
    .neq('id', currentId)
    .order('announcement_date', { ascending: false })

  if (error) {
    console.error('取得標案歷史失敗:', error)
    return []
  }
  return data
}

async function getTenderDetail(announcementId) {
  const { data, error } = await supabase
    .from('gcc_tender_detail')
    .select(
      `
      *,
      gcc_committee_list_info (
        procurement_level,
        org_name,
        tender_name,
        is_public_committee
      )
    `
    )
    .eq('announcement_id', announcementId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('取得標案詳細資料失敗:', error)
    return null
  }
  return data
}

async function getTenderDetailsForAnnouncements(announcementIds) {
  if (!announcementIds || announcementIds.length === 0) return {}

  const { data, error } = await supabase
    .from('gcc_tender_detail')
    .select('*')
    .in('announcement_id', announcementIds)

  if (error) {
    console.error('批量取得標案詳情失敗:', error)
    return {}
  }

  const map = {}
  for (const detail of data) {
    if (detail.announcement_id) {
      map[detail.announcement_id] = detail
    }
  }
  return map
}

async function getFieldMapping() {
  const { data, error } = await supabase
    .from('gcc_tender_detail_field_mapping')
    .select('*')
    .order('category', { ascending: true })
    .order('field_code', { ascending: true })

  if (error) {
    console.error('取得欄位對應表失敗:', error)
    return []
  }
  return data
}

async function getTenderFiles(detailId) {
  if (!detailId) return []
  const { data, error } = await supabase
    .from('gcc_tender_file')
    .select('*')
    .eq('detail_id', detailId)
    .order('seq_no', { ascending: true })

  if (error) {
    console.error('取得標案附件失敗:', error)
    return []
  }
  return data || []
}

async function getEvaluationCommittee(detailId) {
  if (!detailId) return []

  const { data, error } = await supabase
    .from('gcc_evaluation_committee')
    .select('*')
    .eq('tender_detail_id', detailId)
    .order('seq_no', { ascending: true })

  if (error) {
    console.error('取得評審委員失敗:', error)
    return []
  }
  return data
}

// ─── Category configuration ─────────────────────────────────────

const CATEGORY_CONFIG = [
  { key: 'A', name: '機關資料', icon: Building2 },
  { key: 'B', name: '採購資料', icon: FileText },
  { key: 'C', name: '招標資料', icon: ClipboardList },
  { key: 'D', name: '領投開標資料', icon: Hash },
  { key: 'E', name: '其他資料', icon: Info },
]

// ─── Page component ─────────────────────────────────────────────

export default async function TenderDetailPage({ params }) {
  const { id } = await params

  const [announcement, fieldMapping] = await Promise.all([
    getTenderAnnouncement(id),
    getFieldMapping(),
  ])

  if (!announcement) {
    notFound()
  }

  const [detail, history] = await Promise.all([
    getTenderDetail(id),
    getTenderHistory(announcement.tender_name, id),
  ])
  const [committee, tenderFiles] = await Promise.all([
    detail?.id ? getEvaluationCommittee(detail.id) : [],
    detail?.id ? getTenderFiles(detail.id) : [],
  ])
  const procurementLevel = detail?.gcc_committee_list_info?.[0]?.procurement_level

  const allAnnouncementIds = [id, ...history.map(h => h.id)]
  const historyDetailMap = await getTenderDetailsForAnnouncements(allAnnouncementIds)

  const previousAnnouncementId = history.length > 0 ? history[0].id : null
  const previousDetail = previousAnnouncementId ? historyDetailMap[previousAnnouncementId] : null

  const screenshotUrl = detail
    ? supabase.storage.from('file').getPublicUrl(`gcc_tender_detail/${detail.id}.png`).data
        .publicUrl
    : null

  return (
    <ScreenshotProvider screenshotUrl={screenshotUrl} tenderName={announcement.tender_name}>
      <div className="min-h-screen bg-slate-50">
        {/* 頂部品牌漸層條 */}
        <div className="h-1 bg-gradient-to-r from-bes-blue-600 via-bes-blue-500 to-bes-green-500" />

        <div className="container mx-auto space-y-6 px-4 py-6">
          {/* 返回按鈕 */}
          <div>
            <Button
              variant="ghost"
              asChild
              className="cursor-pointer hover:bg-bes-blue-50 hover:text-bes-blue-700"
            >
              <Link href="/gcc-tender" className="gap-2">
                <ArrowLeft className="size-4" />
                返回列表
              </Link>
            </Button>
          </div>

          {/* 標案摘要卡片 */}
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-bes-blue-500 text-white hover:bg-bes-blue-600">
                      招標公告
                    </Badge>
                    {getProcurementLevelBadge(procurementLevel)}
                    {announcement.transmission_count > 1 && (
                      <Badge variant="secondary">第 {announcement.transmission_count} 次公告</Badge>
                    )}
                  </div>
                  <CardTitle className="font-heading text-xl leading-relaxed">
                    {announcement.tender_name}
                  </CardTitle>
                  {announcement.tender_no && (
                    <p className="text-sm text-slate-500">標案案號：{announcement.tender_no}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {detail && <ScreenshotButton />}
                  {announcement.detail_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="cursor-pointer border-amber-500 text-amber-700 hover:bg-amber-50"
                    >
                      <a href={announcement.detail_url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 size-4" />
                        政府採購網
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {announcement.org_name && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex cursor-default items-start gap-3 rounded-lg bg-bes-blue-50/50 p-3">
                          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bes-blue-100">
                            <Building2 className="size-4 text-bes-blue-500" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">機關名稱</p>
                            <p className="text-base font-semibold text-bes-blue-950">
                              {announcement.org_name}
                            </p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      {(detail?.a04 || detail?.a01) && (
                        <TooltipContent className="space-y-1">
                          {detail.a04 && <p>機關地址：{detail.a04}</p>}
                          {detail.a01 && <p>機關代碼：{detail.a01}</p>}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )}
                <InfoItem
                  icon={Calendar}
                  label="公告日期"
                  value={
                    announcement.announcement_date
                      ? format(new Date(announcement.announcement_date), 'yyyy年MM月dd日')
                      : null
                  }
                />
                {(() => {
                  if (!announcement.deadline) return null
                  const deadlineStr = format(new Date(announcement.deadline), 'yyyy年MM月dd日')
                  const todayTW = new Intl.DateTimeFormat('en-CA', {
                    timeZone: 'Asia/Taipei',
                  }).format(new Date())
                  const isExpired = todayTW > announcement.deadline

                  return (
                    <div
                      className={`flex items-start gap-3 rounded-lg p-3 ${isExpired ? 'bg-red-50' : 'bg-bes-blue-50/50'}`}
                    >
                      <div
                        className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${isExpired ? 'bg-red-100' : 'bg-bes-blue-100'}`}
                      >
                        {isExpired ? (
                          <ClockAlert className="size-4 text-red-500" />
                        ) : (
                          <Clock className="size-4 text-bes-blue-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">截止投標</p>
                        <p
                          className={`text-base font-semibold ${isExpired ? 'text-red-700' : 'text-bes-blue-950'}`}
                        >
                          {deadlineStr}
                          {isExpired && (
                            <span className="block text-xs font-normal text-red-400">已截止</span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })()}
                {(() => {
                  const amt = announcement.budget
                  if (!amt) return null
                  const num =
                    typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/,/g, ''))
                  if (isNaN(num)) return null
                  const full = `NT$ ${num.toLocaleString('zh-TW')}`
                  const unit = `NT$ ${formatBudget(num)}`
                  const needTooltip = full !== unit

                  return (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex cursor-default items-start gap-3 rounded-lg bg-bes-blue-50/50 p-3">
                            <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bes-blue-100">
                              <DollarSign className="size-4 text-bes-blue-500" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-500">預算金額</p>
                              <p className="text-base font-semibold text-bes-blue-700">{unit}</p>
                            </div>
                          </div>
                        </TooltipTrigger>
                        {needTooltip && (
                          <TooltipContent>
                            <p>{full}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )
                })()}
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
                <div>
                  <p className="text-slate-500">傳輸次數</p>
                  <p className="font-medium">
                    {announcement.transmission_count
                      ? `第 ${announcement.transmission_count} 次`
                      : '-'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">招標方式</p>
                  <p className="font-medium">{announcement.tender_method || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">採購性質</p>
                  <p className="font-medium">{announcement.procurement_nature || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">採購級距</p>
                  <p className="font-medium">{procurementLevel || '-'}</p>
                </div>
                <div>
                  <p className="text-slate-500">是否更正</p>
                  <p className="font-medium">{announcement.is_correction ? '是' : '否'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 公告歷程 */}
          {history.length > 0 && (
            <HistoryTimeline
              history={history}
              currentAnnouncement={announcement}
              detailMap={historyDetailMap}
              fieldMapping={fieldMapping}
            />
          )}

          {/* 詳細資料 — 堆疊卡片 */}
          {detail ? (
            <>
              {CATEGORY_CONFIG.map(cat => {
                const hasFields = fieldMapping.some(
                  fm => fm.category === cat.key && fm.field_code !== 'a01'
                )
                if (!hasFields) return null

                return (
                  <DetailCard key={cat.key} icon={cat.icon} title={cat.name}>
                    <DetailSection
                      title={cat.key}
                      detail={detail}
                      fieldMapping={fieldMapping}
                      previousDetail={previousDetail}
                    />
                  </DetailCard>
                )
              })}

              {committee.length > 0 && (
                <DetailCard icon={Users} title="評審委員">
                  <CommitteeTable committee={committee} />
                </DetailCard>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paperclip className="size-5 text-bes-blue-500" />
                    附件檔案
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {tenderFiles.length} 個檔案
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FileList
                    files={tenderFiles}
                    emptyText="此標案尚無附件檔案"
                    getDownloadUrl={file => {
                      if (file.download_status !== 'success' || !file.storage_path) return null
                      return supabase.storage
                        .from('file')
                        .getPublicUrl(file.storage_path, { download: file.file_name || true }).data
                        .publicUrl
                    }}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto mb-4 size-12 text-slate-300" />
                <h3 className="mb-2 font-heading text-lg font-medium text-bes-blue-900">
                  尚無詳細資料
                </h3>
                <p className="text-sm text-slate-500">此標案的詳細資料尚未被爬取</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </ScreenshotProvider>
  )
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const announcement = await getTenderAnnouncement(id)

  if (!announcement) {
    return {
      title: '標案不存在',
    }
  }

  return {
    title: `${announcement.tender_name} - 招標公告`,
    description: `${announcement.org_name} - ${announcement.tender_name}`,
  }
}
