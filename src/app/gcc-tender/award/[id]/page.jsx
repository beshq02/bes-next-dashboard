import Link from 'next/link'
import { format } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  ExternalLink,
  FileText,
  Globe,
  Users,
  Package,
  Award,
  AlertTriangle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

import InfoItem from '../../components/shared/InfoItem'
import DetailCard from '../../components/shared/DetailCard'
import DetailRow from '../../components/shared/DetailRow'
import ScreenshotProvider from '../../components/shared/ScreenshotProvider'
import ScreenshotButton from '../../components/shared/ScreenshotButton'
import { getProcurementLevelBadge, formatBudget } from '../../lib/utils'

// ─── Data fetching ──────────────────────────────────────────────

async function getAwardAnnouncement(id) {
  const { data, error } = await supabase
    .from('gcc_award_announcement')
    .select('*, tender_type(id, type)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('取得決標公告失敗:', error)
    return null
  }
  return data
}

async function getAwardDetail(announcementId) {
  const { data, error } = await supabase
    .from('gcc_award_detail')
    .select('*')
    .eq('announcement_id', announcementId)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('取得決標詳細資料失敗:', error)
    return null
  }
  return data
}

async function getFieldMapping() {
  const { data, error } = await supabase
    .from('gcc_award_detail_field_mapping')
    .select('field_code, field_name, category, category_name')
    .order('category')
    .order('field_code')

  if (error) {
    console.error('取得欄位對應失敗:', error)
    return []
  }
  return data || []
}

// ─── Category configuration ─────────────────────────────────────

const AWARD_CATEGORIES = [
  { key: 'A', name: '機關資料', icon: Building2 },
  { key: 'B', name: '已公告資料', icon: FileText },
  { key: 'C', name: '投標廠商', icon: Users },
  { key: 'D', name: '決標品項', icon: Package },
  { key: 'F', name: '決標資料', icon: Award },
  { key: 'E', name: '英文公告', icon: Globe },
]

const UNABLE_CATEGORIES = [
  { key: 'A', name: '機關資料', icon: Building2 },
  { key: 'B', name: '已公告資料', icon: FileText },
  { key: 'Z', name: '無法決標資料', icon: AlertTriangle },
]

const JSONB_FIELDS = new Set(['c02', 'd02', 'e7'])

// ─── JSONB field rendering ──────────────────────────────────────

function JsonbItemContent({ item }) {
  if (typeof item !== 'object' || item === null) {
    return <span className="text-sm">{String(item)}</span>
  }

  return (
    <dl className="space-y-1.5">
      {Object.entries(item).map(([key, value]) => {
        if (value == null || value === '') return null

        if (Array.isArray(value)) {
          return (
            <div key={key} className="pt-1">
              <dt className="mb-1.5 text-xs font-medium text-slate-500">{key}</dt>
              <dd className="space-y-2 pl-3">
                {value.map((subItem, j) => (
                  <div key={j} className="rounded border border-slate-100 bg-slate-50 p-2.5">
                    <JsonbItemContent item={subItem} />
                  </div>
                ))}
              </dd>
            </div>
          )
        }

        return (
          <div key={key} className="grid grid-cols-[minmax(auto,180px)_1fr] gap-2">
            <dt className="text-xs text-slate-500">{key}</dt>
            <dd className="break-all text-sm font-medium">{String(value)}</dd>
          </div>
        )
      })}
    </dl>
  )
}

function JsonbDisplay({ data, label }) {
  if (!data) return null
  const items = Array.isArray(data) ? data : [data]
  if (items.length === 0) return null

  return (
    <div className="py-2">
      <p className="mb-3 text-sm font-medium text-slate-500">{label}</p>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-white p-4">
            <JsonbItemContent item={item} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Field value formatting ─────────────────────────────────────

function formatFieldValue(fieldCode, value) {
  if (value == null || value === '') return null

  if (fieldCode === 'b26') {
    const num = typeof value === 'number' ? value : parseFloat(String(value).replace(/,/g, ''))
    if (!isNaN(num)) return `NT$ ${num.toLocaleString('zh-TW')}`
  }

  if (fieldCode === 'f02' || fieldCode === 'f03') {
    try {
      return format(new Date(value), 'yyyy年MM月dd日')
    } catch (_e) {
      return String(value)
    }
  }

  return String(value)
}

// ─── Page component ─────────────────────────────────────────────

export default async function AwardDetailPage({ params }) {
  const { id } = await params

  const announcement = await getAwardAnnouncement(id)
  if (!announcement) {
    notFound()
  }

  const [detail, fieldMappingData] = await Promise.all([
    getAwardDetail(id),
    getFieldMapping(),
  ])

  const tenderTypeName = announcement.tender_status
  const isUnableToAward = tenderTypeName === '無法決標'
  const colorScheme = isUnableToAward ? 'rose' : 'emerald'
  const categories = isUnableToAward ? UNABLE_CATEGORIES : AWARD_CATEGORIES

  const screenshotUrl = detail
    ? supabase.storage.from('file').getPublicUrl(`gcc_award_detail/${detail.id}.png`).data.publicUrl
    : null

  const d = detail || {}

  return (
    <ScreenshotProvider screenshotUrl={screenshotUrl} tenderName={announcement.tender_name}>
    <div className="min-h-screen bg-slate-50">
      {/* 頂部漸層條 */}
      <div className={`h-1 bg-gradient-to-r ${
        isUnableToAward
          ? 'from-rose-600 via-rose-500 to-rose-400'
          : 'from-emerald-600 via-emerald-500 to-bes-green-500'
      }`} />

      <div className="container mx-auto space-y-6 px-4 py-6">
        {/* 返回按鈕 */}
        <div>
          <Button
            variant="ghost"
            asChild
            className={`cursor-pointer ${
              isUnableToAward
                ? 'hover:bg-rose-50 hover:text-rose-700'
                : 'hover:bg-emerald-50 hover:text-emerald-700'
            }`}
          >
            <Link href="/gcc-tender" className="gap-2">
              <ArrowLeft className="size-4" />
              返回列表
            </Link>
          </Button>
        </div>

        {/* 摘要卡片 */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={
                    isUnableToAward
                      ? 'bg-rose-500 text-white hover:bg-rose-600'
                      : 'bg-emerald-500 text-white hover:bg-emerald-600'
                  }>
                    {tenderTypeName}
                  </Badge>
                  {d.b19 && getProcurementLevelBadge(d.b19)}
                  {announcement.is_correction && (
                    <Badge variant="outline" className="border-amber-300 text-amber-600">更正公告</Badge>
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
              <InfoItem
                icon={Building2}
                label="機關名稱"
                value={d.a02 || announcement.org_name}
                colorScheme={colorScheme}
              />
              <InfoItem
                icon={Calendar}
                label={isUnableToAward ? '公告日期' : '決標日期'}
                value={announcement.award_date
                  ? format(new Date(announcement.award_date), 'yyyy年MM月dd日')
                  : null
                }
                colorScheme={colorScheme}
              />
              {(() => {
                const amt = isUnableToAward ? d.b26 : (announcement.award_amount || d.b26)
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
                        <div className={`flex cursor-default items-start gap-3 rounded-lg ${
                          isUnableToAward ? 'bg-rose-50/50' : 'bg-emerald-50/50'
                        } p-3`}>
                          <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${
                            isUnableToAward ? 'bg-rose-100' : 'bg-emerald-100'
                          }`}>
                            <DollarSign className={`size-4 ${
                              isUnableToAward ? 'text-rose-500' : 'text-emerald-500'
                            }`} />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">
                              {isUnableToAward ? '預算金額' : '決標金額'}
                            </p>
                            <p className={`text-base font-semibold ${
                              isUnableToAward ? 'text-rose-700' : 'text-emerald-700'
                            }`}>{unit}</p>
                          </div>
                        </div>
                      </TooltipTrigger>
                      {needTooltip && (
                        <TooltipContent><p>{full}</p></TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                )
              })()}
              <InfoItem
                icon={FileText}
                label="採購性質"
                value={announcement.procurement_type}
                colorScheme={colorScheme}
              />
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
              <div>
                <p className="text-slate-500">招標方式</p>
                <p className="font-medium">{announcement.tender_way || d.b02 || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">決標方式</p>
                <p className="font-medium">{d.b03 || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">傳輸次數</p>
                <p className="font-medium">{d.b05 || '-'}</p>
              </div>
              <div>
                <p className="text-slate-500">是否更正</p>
                <p className="font-medium">{announcement.is_correction ? '是' : '否'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 無法決標 警示橫幅 */}
        {isUnableToAward && d.z05 && (
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="flex items-start gap-3 py-4">
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-rose-500" />
              <div>
                <p className="font-medium text-rose-800">無法決標原因</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-rose-700">{d.z05}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 詳細資料 */}
        {detail ? (
          categories.map((cat) => {
            const catFields = fieldMappingData.filter((fm) => fm.category === cat.key)
            const validFields = catFields.filter((fm) => {
              const val = detail[fm.field_code]
              return val != null && val !== ''
            })
            if (validFields.length === 0) return null

            return (
              <DetailCard key={cat.key} icon={cat.icon} title={cat.name} colorScheme={colorScheme}>
                {validFields.map((field) => {
                  const val = detail[field.field_code]

                  if (JSONB_FIELDS.has(field.field_code)) {
                    return (
                      <JsonbDisplay
                        key={field.field_code}
                        data={val}
                        label={field.field_name}
                      />
                    )
                  }

                  return (
                    <DetailRow
                      key={field.field_code}
                      label={field.field_name}
                      value={formatFieldValue(field.field_code, val)}
                    />
                  )
                })}
              </DetailCard>
            )
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 size-12 text-slate-300" />
              <h3 className="mb-2 font-heading text-lg font-medium text-bes-blue-900">
                尚無詳細資料
              </h3>
              <p className="text-sm text-slate-500">
                此{isUnableToAward ? '無法決標' : '決標'}案的詳細資料尚未被爬取
              </p>
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
  const announcement = await getAwardAnnouncement(id)

  if (!announcement) {
    return { title: '決標公告不存在' }
  }

  const typeName = announcement.tender_status === '無法決標' ? '無法決標' : '決標公告'
  return {
    title: `${announcement.tender_name} - ${typeName}`,
    description: `${announcement.org_name} - ${announcement.tender_name}`,
  }
}
