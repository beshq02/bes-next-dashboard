import { notFound } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, FileText } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import TenderSummaryCard from './components/TenderSummaryCard'
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

// ─── Constants ──────────────────────────────────────────────────

const CATEGORY_NAMES = {
  A: '機關資料',
  B: '採購資料',
  C: '招標資料',
  D: '領投開標資料',
  E: '其他資料',
}

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
  const committee = detail?.id ? await getEvaluationCommittee(detail.id) : []
  const procurementLevel = detail?.gcc_committee_list_info?.[0]?.procurement_level

  const allAnnouncementIds = [id, ...history.map(h => h.id)]
  const historyDetailMap = await getTenderDetailsForAnnouncements(allAnnouncementIds)

  // 取得最近一筆歷史的 detail（用於變動比對）
  const previousAnnouncementId = history.length > 0 ? history[0].id : null
  const previousDetail = previousAnnouncementId ? historyDetailMap[previousAnnouncementId] : null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 頂部品牌漸層條 */}
      <div className="h-1 bg-gradient-to-r from-bes-blue-600 via-bes-blue-500 to-bes-green-500" />

      <div className="container mx-auto space-y-6 px-4 py-6">
        {/* 返回按鈕 */}
        <div>
          <Button variant="ghost" asChild className="cursor-pointer hover:bg-bes-blue-50 hover:text-bes-blue-700">
            <Link href="/gcc-tender" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              返回列表
            </Link>
          </Button>
        </div>

        {/* 標案摘要卡片 */}
        <TenderSummaryCard
          announcement={announcement}
          procurementLevel={procurementLevel}
          historyCount={history.length + 1}
        />

        {/* 公告歷程 */}
        {history.length > 0 && (
          <HistoryTimeline
            history={history}
            currentAnnouncement={announcement}
            detailMap={historyDetailMap}
            fieldMapping={fieldMapping}
          />
        )}

        {/* 詳細資料標籤頁 */}
        {detail && (
          <Card>
            <CardHeader>
              <CardTitle>詳細資料</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="A" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-3 sm:grid-cols-6">
                  {Object.entries(CATEGORY_NAMES).map(([key, name]) => (
                    <TabsTrigger
                      key={key}
                      value={key}
                      className="cursor-pointer data-[state=active]:bg-bes-blue-600 data-[state=active]:text-white"
                    >
                      {name}
                    </TabsTrigger>
                  ))}
                  <TabsTrigger
                    value="committee"
                    className="cursor-pointer data-[state=active]:bg-bes-blue-600 data-[state=active]:text-white"
                  >
                    評審委員
                  </TabsTrigger>
                </TabsList>

                {Object.keys(CATEGORY_NAMES).map(category => (
                  <TabsContent key={category} value={category}>
                    <DetailSection
                      title={category}
                      detail={detail}
                      fieldMapping={fieldMapping}
                      previousDetail={previousDetail}
                    />
                  </TabsContent>
                ))}

                <TabsContent value="committee">
                  <CommitteeTable committee={committee} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* 沒有詳細資料時的提示 */}
        {!detail && (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="mx-auto mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-medium font-heading text-bes-blue-900">尚無詳細資料</h3>
              <p className="text-sm text-slate-500">此標案的詳細資料尚未被爬取</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
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
    title: `${announcement.tender_name} - 政府採購標案`,
    description: `${announcement.org_name} - ${announcement.tender_name}`,
  }
}
