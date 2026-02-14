'use server'

import { supabase } from '@/lib/supabase'

const CONVERT_API = 'https://web-production-6c7cc.up.railway.app/convert'

export async function convertFile(fileStoragePath, detailId) {
  // 1. 取得檔案的完整公開 URL
  const { data: urlData } = supabase.storage
    .from('file')
    .getPublicUrl(fileStoragePath)

  const fileUrl = urlData?.publicUrl
  if (!fileUrl) {
    return { success: false, message: '無法取得檔案 URL' }
  }

  // 2. 呼叫 Convert API
  const res = await fetch(CONVERT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      file_url: fileUrl,
      detail_id: detailId || null,
    }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const errBody = await res.json()
      detail = errBody.detail || errBody.message || JSON.stringify(errBody)
    } catch (_e) {
      detail = await res.text().catch(() => '')
    }
    return { success: false, message: `API 錯誤 (${res.status}): ${detail}` }
  }

  const result = await res.json()

  if (!result.success || !result.markdown_storage_path) {
    return { success: false, message: result.message || '轉換失敗' }
  }

  // 3. 從 Supabase Storage 讀取轉換後的 Markdown 內容
  const { data, error } = await supabase.storage
    .from('file')
    .download(result.markdown_storage_path)

  if (error) {
    return { success: false, message: `讀取 Markdown 失敗: ${error.message}` }
  }

  const markdown = await data.text()

  return {
    success: true,
    markdown,
    storagePath: result.markdown_storage_path,
    length: result.markdown_length,
    message: result.message,
  }
}
