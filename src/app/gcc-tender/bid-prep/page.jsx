import { supabase } from '@/lib/supabase'
import BidPrepClient from './components/BidPrepClient'

async function getFavoriteTenders() {
  // 1. 取得收藏清單
  const { data: favs, error: favError } = await supabase
    .from('gcc_favorite')
    .select('tender_no')
    .eq('user_id', 'default')

  if (favError || !favs || favs.length === 0) return []

  const tenderNos = favs.map(f => f.tender_no)

  // 2. 依 tender_no 取得招標公告（每個 tender_no 取最新一筆）
  const { data: announcements, error: annError } = await supabase
    .from('gcc_tender_announcement')
    .select('id, tender_no, tender_name, org_name, announcement_date, budget')
    .in('tender_no', tenderNos)
    .order('announcement_date', { ascending: false })

  if (annError || !announcements) return []

  // 每個 tender_no 只保留最新一筆
  const seen = new Set()
  const latest = []
  for (const ann of announcements) {
    if (!seen.has(ann.tender_no)) {
      seen.add(ann.tender_no)
      latest.push(ann)
    }
  }

  if (latest.length === 0) return []

  // 3. 取得詳細資料 (announcement_id → detail)
  const annIds = latest.map(a => a.id)
  const { data: details, error: detailError } = await supabase
    .from('gcc_tender_detail')
    .select('id, announcement_id')
    .in('announcement_id', annIds)

  if (detailError) return latest.map(a => ({ ...a, detail_id: null, files: [] }))

  const detailMap = new Map()
  for (const d of details) {
    detailMap.set(d.announcement_id, d.id)
  }

  // 4. 取得附件檔案
  const detailIds = details.map(d => d.id)
  let filesMap = new Map()

  if (detailIds.length > 0) {
    const { data: files, error: fileError } = await supabase
      .from('gcc_tender_file')
      .select('*')
      .in('detail_id', detailIds)
      .order('seq_no', { ascending: true })

    if (!fileError && files) {
      for (const f of files) {
        if (!filesMap.has(f.detail_id)) filesMap.set(f.detail_id, [])
        filesMap.get(f.detail_id).push(f)
      }
    }
  }

  // 5. 組合結果（預先計算下載 URL，避免客戶端需要 Supabase client）
  return latest.map(a => {
    const detailId = detailMap.get(a.id) || null
    const rawFiles = detailId ? (filesMap.get(detailId) || []) : []
    const files = rawFiles.map(f => ({
      ...f,
      downloadUrl:
        f.download_status === 'success' && f.storage_path
          ? supabase.storage.from('file').getPublicUrl(f.storage_path, { download: f.file_name || true }).data.publicUrl
          : null,
    }))
    return { ...a, detail_id: detailId, files }
  })
}

export default async function BidPrepPage() {
  const tenders = await getFavoriteTenders()

  return <BidPrepClient tenders={tenders} />
}

export const metadata = {
  title: '備標作業 | GCC 標案系統',
}
