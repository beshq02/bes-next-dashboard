import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import {
  Eye,
  EyeOff,
  Hash,
  Phone,
  Clock,
  Calendar,
  Paperclip,
  ArrowLeft,
  Building2,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  CheckCircle2,
  ClipboardList,
  Globe,
  MapPin,
  Inbox,
  User,
  Mail,
  ShieldCheck,
  Info,
  CalendarRange,
} from 'lucide-react'
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileArchive,
  FaFileAlt,
  FaFileCsv,
} from 'react-icons/fa'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Card, CardTitle, CardHeader, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import { getProcurementLevelBadge, formatBudget } from '../../lib/utils'
import InfoItem from '../../components/shared/InfoItem'
import DetailRow from '../../components/shared/DetailRow'
import ScreenshotProvider from '../../components/shared/ScreenshotProvider'
import ScreenshotButton from '../../components/shared/ScreenshotButton'

// ─── Data fetching ──────────────────────────────────────────────

async function getTpreadAnnouncement(id) {
  const { data, error } = await supabase
    .from('gcc_tpread_announcement')
    .select('*, tender_type(id, type)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('取得公開閱覽公告失敗:', error)
    return null
  }
  return data
}

async function getTpreadDetail(announcementId) {
  const { data, error } = await supabase
    .from('gcc_tpread_detail')
    .select('*')
    .eq('announcement_id', announcementId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('取得公開閱覽詳細資料失敗:', error)
    return null
  }
  return data
}

async function getTpreadFiles(detailId) {
  if (!detailId) return []
  const { data, error } = await supabase
    .from('gcc_tpread_file')
    .select('*')
    .eq('detail_id', detailId)
    .order('seq_no', { ascending: true })

  if (error) {
    console.error('取得公開閱覽附件失敗:', error)
    return []
  }
  return data || []
}

async function getFieldMapping() {
  const { data, error } = await supabase
    .from('gcc_tpread_detail_field_mapping')
    .select('field_code, field_name')

  if (error) {
    console.error('取得欄位對應失敗:', error)
    return {}
  }
  return Object.fromEntries((data || []).map((r) => [r.field_code, r.field_name]))
}

// ─── File type config ────────────────────────────────────────────

function getFileTypeStyle(extension) {
  const ext = (extension || '').replace(/^\./, '').toLowerCase()
  const map = {
    pdf:  { icon: FaFilePdf, bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200' },
    doc:  { icon: FaFileWord, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    docx: { icon: FaFileWord, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    odt:  { icon: FaFileWord, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
    xls:  { icon: FaFileExcel, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    xlsx: { icon: FaFileExcel, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    csv:  { icon: FaFileCsv, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    ods:  { icon: FaFileExcel, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    ppt:  { icon: FaFilePowerpoint, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    pptx: { icon: FaFilePowerpoint, bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200' },
    jpg:  { icon: FaFileImage, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    jpeg: { icon: FaFileImage, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    png:  { icon: FaFileImage, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    gif:  { icon: FaFileImage, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200' },
    zip:  { icon: FaFileArchive, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    rar:  { icon: FaFileArchive, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
    '7z': { icon: FaFileArchive, bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
  }
  return map[ext] || { icon: FaFileAlt, bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' }
}

// ─── Helper ─────────────────────────────────────────────────────

// 民國日期轉西元 (e.g. "115/02/10" → "2026年02月10日")
function rocToAD(rocStr) {
  if (!rocStr) return rocStr
  return rocStr.replace(/(\d{2,3})\/(\d{2})\/(\d{2})/g, (_m, y, m, d) => {
    return `${parseInt(y, 10) + 1911}年${m}月${d}日`
  })
}

// ISO 日期轉中文格式 (e.g. "2026-02-26" → "2026年02月26日")
function formatDateSlash(dateStr) {
  if (!dateStr) return dateStr
  return format(new Date(dateStr), 'yyyy年MM月dd日')
}

// ─── Page component ─────────────────────────────────────────────

export default async function TpreadDetailPage({ params }) {
  const { id } = await params

  const announcement = await getTpreadAnnouncement(id)
  if (!announcement) {
    notFound()
  }

  const [detail, fieldMap] = await Promise.all([getTpreadDetail(id), getFieldMapping()])
  const files = await getTpreadFiles(detail?.id)
  const f = (code, fallback) => fieldMap[code] || fallback || code

  // 優先用 detail 資料，沒有 detail 就用 announcement 資料
  const d = detail || {}

  const screenshotUrl = detail
    ? supabase.storage.from('file').getPublicUrl(`gcc_tpread_detail/${detail.id}.png`).data.publicUrl
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
                  <Badge className="bg-violet-500 text-white hover:bg-violet-600">公開閱覽</Badge>
                  {getProcurementLevelBadge(d.procurement_range || announcement.real_tender_range)}
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
              {(d.org_name || announcement.org_name) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex cursor-default items-start gap-3 rounded-lg bg-bes-blue-50/50 p-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-bes-blue-100">
                          <Building2 className="size-4 text-bes-blue-500" />
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{f('org_name')}</p>
                          <p className="text-base font-semibold text-bes-blue-950">
                            {d.org_name || announcement.org_name}
                          </p>
                        </div>
                      </div>
                    </TooltipTrigger>
                    {(d.org_address || d.org_code) && (
                      <TooltipContent className="space-y-1">
                        {d.org_address && <p>機關地址：{d.org_address}</p>}
                        {d.org_code && <p>機關代碼：{d.org_code}</p>}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
              )}
              <InfoItem
                icon={Calendar}
                label={f('announcement_date')}
                value={(() => {
                  const date = d.announcement_date || announcement.announcement_date
                  if (!date) return null
                  return format(new Date(date), 'yyyy年MM月dd日')
                })()}
              />
              {(() => {
                const startDate = d.review_start_date || announcement.review_start_date
                const endDateRaw = d.review_end_date || announcement.review_end_date
                const startObj = startDate ? new Date(startDate) : null
                const endObj = endDateRaw ? new Date(endDateRaw) : null
                const sameYear = startObj && endObj && startObj.getFullYear() === endObj.getFullYear()
                const sameMonth = sameYear && startObj.getMonth() === endObj.getMonth()
                const endFmt = sameMonth ? 'dd日' : sameYear ? 'MM月dd日' : 'yyyy年MM月dd日'
                const reviewValue = startObj && endObj
                  ? `${format(startObj, 'yyyy年MM月dd日')} ~ ${format(endObj, endFmt)}`
                  : null
                if (!reviewValue) return null

                const todayTW = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Taipei' }).format(new Date())
                const isExpired = endDateRaw && todayTW > endDateRaw

                const ReviewIcon = isExpired ? EyeOff : Eye
                return (
                  <div className={`flex items-start gap-3 rounded-lg p-3 ${isExpired ? 'bg-red-50' : 'bg-bes-blue-50/50'}`}>
                    <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${isExpired ? 'bg-red-100' : 'bg-bes-blue-100'}`}>
                      <ReviewIcon className={`size-4 ${isExpired ? 'text-red-500' : 'text-bes-blue-500'}`} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{f('review_period')}</p>
                      <p className={`text-base font-semibold ${isExpired ? 'text-red-700' : 'text-bes-blue-950'}`}>
                        {reviewValue}
                        {isExpired && <span className="block text-xs font-normal text-red-400">已截止</span>}
                      </p>
                    </div>
                  </div>
                )
              })()}
              {(() => {
                const amt = d.budget_amount || announcement.budget
                if (!amt) return null
                const num = typeof amt === 'number' ? amt : parseFloat(String(amt).replace(/,/g, ''))
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
                            <p className="text-xs text-slate-500">{f('budget_amount')}</p>
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
                <p className="text-slate-500">{f('announcement_count')}</p>
                <p className="font-medium">
                  {d.announcement_count ? `第 ${parseInt(d.announcement_count, 10)} 次` : '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{f('tender_method')}</p>
                <p className="font-medium">
                  {d.tender_method || announcement.tender_method || '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{f('procurement_nature')}</p>
                <p className="font-medium">
                  {d.procurement_nature || announcement.procurement_nature || '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{f('procurement_range')}</p>
                <p className="font-medium">
                  {d.procurement_range || announcement.real_tender_range || '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-500">{f('is_published_gazette')}</p>
                <p className="font-medium">{d.is_published_gazette || '-'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 詳細資料 */}
        {detail ? (
          <>
            {/* 閱覽資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="size-5 text-bes-blue-500" />
                  閱覽資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                <DetailRow icon={CalendarRange} label={f('review_period')} value={rocToAD(detail.review_period)} />
                <DetailRow
                  icon={Clock}
                  label={f('opinion_deadline')}
                  value={detail.opinion_deadline ? (() => {
                    const dateStr = formatDateSlash(detail.opinion_deadline)
                    const deadline = new Date(`${detail.opinion_deadline}T17:00:00+08:00`)
                    const now = new Date()
                    const diffMs = deadline - now
                    if (diffMs <= 0) {
                      return <>{dateStr} <span className="ml-1.5 text-xs font-normal text-red-500">已超過期限</span></>
                    }
                    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
                    const days = Math.floor(totalHours / 24)
                    const hours = totalHours % 24
                    const remaining = days > 0 ? `還剩 ${days} 天 ${hours} 小時` : `還剩 ${hours} 小時`
                    return <>{dateStr} <span className="ml-1.5 text-xs font-normal text-amber-600">{remaining}</span></>
                  })() : null}
                />
                <DetailRow icon={Globe} label={f('is_online_review')} value={detail.is_online_review} />
                <DetailRow icon={ClipboardList} label={f('review_method')} value={detail.review_method} />
                <DetailRow icon={MapPin} label={f('review_location')} value={detail.review_location} />
                <DetailRow icon={Inbox} label={f('opinion_receiving_location')} value={detail.opinion_receiving_location} />
              </CardContent>
            </Card>

            {/* 聯絡資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="size-5 text-bes-blue-500" />
                  聯絡資訊
                </CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100">
                <DetailRow icon={MapPin} label={f('org_address')} value={detail.org_address} />
                <DetailRow icon={User} label={f('contact_person')} value={detail.contact_person} />
                <DetailRow icon={Phone} label={f('contact_phone')} value={detail.contact_phone} />
                <DetailRow icon={Mail} label={f('contact_email')} value={detail.contact_email} />
                <DetailRow icon={Clock} label={f('office_hours')} value={detail.office_hours} />
              </CardContent>
            </Card>

            {/* 內容摘要 */}
            {(detail.content_summary ||
              detail.vendor_qualification_summary ||
              detail.additional_notes) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="size-5 text-bes-blue-500" />
                    內容摘要
                  </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-slate-100">
                  <DetailRow icon={FileText} label={f('content_summary')} value={detail.content_summary} />
                  <DetailRow icon={ShieldCheck} label={f('vendor_qualification_summary')} value={detail.vendor_qualification_summary} />
                  <DetailRow icon={Info} label={f('additional_notes')} value={detail.additional_notes} />
                </CardContent>
              </Card>
            )}

            {/* 附件檔案 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="size-5 text-bes-blue-500" />
                  附件檔案
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {files.length} 個檔案
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {files.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {files.map((file, idx) => {
                      const ft = getFileTypeStyle(file.file_extension)
                      const ExtIcon = ft.icon
                      const isLargeFile = file.file_size != null && file.file_size >= 52428800
                      return (
                      <div
                        key={file.id}
                        className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <span className="w-5 shrink-0 text-center text-xs text-slate-400">{idx + 1}</span>
                          <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${ft.bg}`}>
                            <ExtIcon className={`size-5 ${ft.text}`} />
                          </div>
                          <div className="min-w-0">
                            <p className="break-all text-sm font-medium text-bes-blue-950">
                              {file.file_name?.replace(/\.[^.]+$/, '') || file.file_name}
                            </p>
                            <div className="flex items-center gap-2">
                              {file.file_extension && (
                                <Badge variant="outline" className={`px-1.5 py-0 text-[10px] uppercase ${ft.text} ${ft.border}`}>
                                  {file.file_extension.replace(/^\./, '')}
                                </Badge>
                              )}
                              {file.file_size != null && (
                                isLargeFile ? (
                                  <Badge className="gap-1 border border-amber-300 bg-amber-100 px-1.5 py-0 text-[11px] font-semibold text-amber-700 hover:bg-amber-100">
                                    <AlertCircle className="size-3" />
                                    {(file.file_size / 1048576).toFixed(1)} MB
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    {file.file_size >= 1048576
                                      ? `${(file.file_size / 1048576).toFixed(1)} MB`
                                      : '小於 1MB'}
                                  </span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0">
                          {file.download_status === 'success' ? (
                            <Badge className="gap-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
                              <CheckCircle2 className="size-3" />
                              已下載
                            </Badge>
                          ) : file.download_status === 'skipped' ? (
                            <Badge className="gap-1 bg-slate-100 text-slate-600 hover:bg-slate-100">
                              <AlertCircle className="size-3" />
                              已略過
                            </Badge>
                          ) : (
                            <Badge className="gap-1 bg-amber-100 text-amber-700 hover:bg-amber-100">
                              <Clock className="size-3" />
                              待下載
                            </Badge>
                          )}
                        </div>
                      </div>
                    )})}
                  </div>
                ) : (
                  <div className="py-6 text-center">
                    <Paperclip className="mx-auto mb-2 size-8 text-slate-300" />
                    <p className="text-sm text-slate-400">此案尚無附件檔案</p>
                  </div>
                )}
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
              <p className="text-sm text-slate-500">此公開閱覽案的詳細資料尚未被爬取</p>
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
  const announcement = await getTpreadAnnouncement(id)

  if (!announcement) {
    return { title: '公開閱覽案不存在' }
  }

  return {
    title: `${announcement.tender_name} - 公開閱覽`,
    description: `${announcement.org_name} - ${announcement.tender_name}`,
  }
}
