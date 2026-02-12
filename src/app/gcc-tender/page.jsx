import { supabase } from '@/lib/supabase'
import TenderListClient from './components/TenderListClient'

// 取得標案公告資料（含採購級距），以標案名稱去重，只保留最新一筆
async function getTenderData() {
  // 先取得所有標案公告（依公告日期降冪排序）
  const { data: announcements, error: announcementError } = await supabase
    .from('gcc_tender_announcement')
    .select('*')
    .order('announcement_date', { ascending: false })

  if (announcementError) {
    console.error('取得標案資料失敗:', announcementError)
    return []
  }

  // 取得所有標案詳情與採購級距
  const { data: details, error: detailError } = await supabase
    .from('gcc_tender_detail')
    .select(`
      id,
      announcement_id,
      gcc_committee_list_info (
        procurement_level
      )
    `)

  // 建立 announcement_id -> detail 的對應表
  const detailMap = new Map()
  if (!detailError && details) {
    for (const detail of details) {
      if (detail.announcement_id) {
        detailMap.set(detail.announcement_id, detail)
      }
    }
  }

  // 合併資料並加入採購級距
  const allData = announcements.map(item => {
    const detail = detailMap.get(item.id)
    return {
      ...item,
      procurement_level: detail?.gcc_committee_list_info?.[0]?.procurement_level || null,
      detail_id: detail?.id || null,
    }
  })

  // 以 tender_name 去重，只保留最新的一筆（已按 announcement_date DESC 排序，第一筆即最新）
  const uniqueMap = new Map()
  for (const item of allData) {
    const key = item.tender_name
    if (!key) continue
    if (!uniqueMap.has(key)) {
      // 計算同名標案數量
      const historyCount = allData.filter(d => d.tender_name === key).length
      uniqueMap.set(key, { ...item, history_count: historyCount })
    }
  }

  return Array.from(uniqueMap.values())
}

// 取得欄位對應表
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

export default async function GccTenderPage() {
  const [tenderData, fieldMapping] = await Promise.all([
    getTenderData(),
    getFieldMapping(),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <TenderListClient 
        initialData={tenderData} 
        fieldMapping={fieldMapping}
      />
    </div>
  )
}

export const metadata = {
  title: '政府採購標案查詢',
  description: '政府電子採購網標案資料檢視系統',
}
