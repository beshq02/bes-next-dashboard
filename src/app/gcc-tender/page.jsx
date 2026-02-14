import { supabase } from '@/lib/supabase'
import TenderListClient from './components/TenderListClient'

// 建立 announcement_id -> detail 欄位的對應表
async function buildDetailMap(table, levelField) {
  const { data, error } = await supabase
    .from(table)
    .select(`id, announcement_id, ${levelField}`)

  const map = new Map()
  if (!error && data) {
    for (const row of data) {
      if (row.announcement_id) {
        map.set(row.announcement_id, row)
      }
    }
  }
  return map
}

// 取得招標類型（從 tender_type 表，依 display_order 排序）
async function getTenderTypes() {
  const { data, error } = await supabase
    .from('tender_type')
    .select('id, type, display_order, if_display')
    .order('display_order')

  if (error) {
    console.error('取得招標類型失敗:', error)
    return []
  }

  return data
}

// 取得採購級距（從 tender_range 表，依 display_order 排序）
async function getTenderRanges() {
  const { data, error } = await supabase
    .from('tender_range')
    .select('id, range, display_order, if_display')
    .order('display_order')

  if (error) {
    console.error('取得採購級距失敗:', error)
    return []
  }

  return data
}

// 取得採購性質（從 proctrg_cate 表，依 display_order 排序）
async function getProcurementCategories() {
  const { data, error } = await supabase
    .from('proctrg_cate')
    .select('id, cate, display_order, if_display')
    .order('display_order')

  if (error) {
    console.error('取得採購性質失敗:', error)
    return []
  }

  return data
}

// 取得招標公告（含 tender_type FK）
async function getTenderAnnouncements() {
  const [{ data, error }, detailMap] = await Promise.all([
    supabase
      .from('gcc_tender_announcement')
      .select('*, tender_type(id, type)')
      .order('announcement_date', { ascending: false }),
    buildDetailMap('gcc_tender_detail', 'b07'),
  ])

  if (error) {
    console.error('取得招標公告失敗:', error)
    return []
  }

  return data.map(item => {
    const detail = detailMap.get(item.id)
    return {
      id: item.id,
      source_type: 'tender',
      tender_type_id: item.tender_type?.id || null,
      tender_type_name: item.tender_type?.type || null,
      tender_no: item.tender_no,
      tender_name: item.tender_name,
      org_name: item.org_name,
      announcement_date: item.announcement_date,
      deadline: item.deadline,
      budget: item.budget,
      tender_method: item.tender_method,
      procurement_level: detail?.b07 || null,
      detail_url: item.detail_url,
      detail_id: detail?.id || null,
      procurement_nature: item.procurement_nature || null,
      is_correction: item.is_correction,
      transmission_count: item.transmission_count,
    }
  })
}

// 取得決標公告（含 tender_type FK）
async function getAwardAnnouncements() {
  const [{ data, error }, detailMap] = await Promise.all([
    supabase
      .from('gcc_award_announcement')
      .select('*, tender_type(id, type)')
      .order('award_date', { ascending: false }),
    buildDetailMap('gcc_award_detail', 'b19'),
  ])

  if (error) {
    console.error('取得決標公告失敗:', error)
    return []
  }

  return data.map(item => {
    const detail = detailMap.get(item.id)
    return {
      id: item.id,
      source_type: 'award',
      tender_type_id: item.tender_type?.id || null,
      tender_type_name: item.tender_type?.type || null,
      tender_no: item.tender_no,
      tender_name: item.tender_name,
      org_name: item.org_name,
      announcement_date: item.award_date,
      deadline: null,
      budget: item.award_amount,
      tender_method: item.tender_way,
      procurement_level: detail?.b19 || null,
      detail_url: item.detail_url,
      procurement_nature: item.procurement_type || null,
      detail_id: detail?.id || null,
      tender_status: item.tender_status,
      is_correction: item.is_correction,
    }
  })
}

// 取得公開閱覽公告（含 tender_type FK）
async function getTpreadAnnouncements() {
  const [{ data, error }, detailMap] = await Promise.all([
    supabase
      .from('gcc_tpread_announcement')
      .select('*, tender_type(id, type)')
      .order('announcement_date', { ascending: false }),
    buildDetailMap('gcc_tpread_detail', 'procurement_range'),
  ])

  if (error) {
    console.error('取得公開閱覽公告失敗:', error)
    return []
  }

  return data.map(item => {
    const detail = detailMap.get(item.id)
    return {
      id: item.id,
      source_type: 'tpread',
      tender_type_id: item.tender_type?.id || null,
      tender_type_name: item.tender_type?.type || null,
      tender_no: item.tender_no,
      tender_name: item.tender_name,
      org_name: item.org_name,
      announcement_date: item.announcement_date,
      deadline: null,
      budget: item.budget,
      tender_method: item.tender_method,
      procurement_level: detail?.procurement_range || null,
      detail_url: item.detail_url,
      detail_id: detail?.id || null,
      procurement_nature: item.procurement_nature || null,
      review_start_date: item.review_start_date,
      review_end_date: item.review_end_date,
    }
  })
}

// 合併三種公告並以 tender_type_id + tender_name 去重
function mergeAndDeduplicate(tenderData, awardData, tpreadData) {
  const allData = [...tenderData, ...awardData, ...tpreadData]

  // 依公告日期降冪排序
  allData.sort((a, b) => {
    const dateA = a.announcement_date ? new Date(a.announcement_date).getTime() : 0
    const dateB = b.announcement_date ? new Date(b.announcement_date).getTime() : 0
    return dateB - dateA
  })

  // 以 tender_type_id + tender_name 去重，同狀態同名只保留最新一筆
  const uniqueMap = new Map()
  for (const item of allData) {
    const key = `${item.tender_type_id}:${item.tender_name}`
    if (!item.tender_name) continue
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, { ...item })
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
  const [tenderData, awardData, tpreadData, tenderTypes, tenderRanges, procurementCategories, fieldMapping] = await Promise.all([
    getTenderAnnouncements(),
    getAwardAnnouncements(),
    getTpreadAnnouncements(),
    getTenderTypes(),
    getTenderRanges(),
    getProcurementCategories(),
    getFieldMapping(),
  ])

  const mergedData = mergeAndDeduplicate(tenderData, awardData, tpreadData)

  return (
    <div className="min-h-screen bg-slate-50">
      <TenderListClient
        initialData={mergedData}
        fieldMapping={fieldMapping}
        tenderTypes={tenderTypes}
        tenderRanges={tenderRanges}
        procurementCategories={procurementCategories}
      />
    </div>
  )
}

export const metadata = {
  title: '政府採購標案查詢',
  description: '政府電子採購網標案資料檢視系統',
}
