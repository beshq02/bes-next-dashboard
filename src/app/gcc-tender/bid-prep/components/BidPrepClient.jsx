'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import {
  AlertCircle,
  Bookmark,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  DollarSign,
  FileText,
  Loader2,
  Paperclip,
} from 'lucide-react'

import { cn } from '@/lib/utils'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import { formatBudget } from '../../lib/utils'
import FileList from '../../components/shared/FileList'
import { convertFile } from '../actions'

export default function BidPrepClient({ tenders = [] }) {
  const [selectedId, setSelectedId] = useState(null)
  const [converting, setConverting] = useState(false)
  const [markdown, setMarkdown] = useState(null)
  const [convertError, setConvertError] = useState(null)

  const selected = tenders.find(t => t.id === selectedId)

  // 切換案件時重設轉換結果
  useEffect(() => {
    setMarkdown(null)
    setConvertError(null)
  }, [selectedId])

  const handleConvert = async () => {
    if (!selected) return

    const file = selected.files.find(
      f => f.storage_path && f.download_status === 'success'
    )
    if (!file) {
      setConvertError('此標案沒有可轉換的檔案')
      return
    }

    setConverting(true)
    setConvertError(null)
    setMarkdown(null)

    try {
      const result = await convertFile(file.storage_path, selected.detail_id)
      if (result.success) {
        setMarkdown(result.markdown)
      } else {
        setConvertError(result.message)
      }
    } catch (_e) {
      setConvertError('轉換過程發生錯誤，請稍後再試')
    } finally {
      setConverting(false)
    }
  }

  if (tenders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <Bookmark className="mb-4 size-12 text-slate-300" />
        <h2 className="font-heading text-lg font-semibold text-bes-blue-900">尚無收藏案件</h2>
        <p className="mt-1 max-w-sm text-sm text-slate-500">
          請先至「標案查詢」頁面將案件加入收藏，即可在此進行備標作業。
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full">
      {/* 左側：收藏案件列表 */}
      <div className={cn(
        'min-w-[18rem] shrink-0 overflow-y-auto border-r border-slate-200 bg-white',
        selected ? 'hidden w-72 lg:block' : 'w-full lg:w-72'
      )}>
        <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-4 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-bes-blue-900">
            <Bookmark className="size-4 text-bes-blue-500" />
            收藏案件
            <Badge variant="secondary" className="ml-auto text-xs">{tenders.length}</Badge>
          </h2>
        </div>
        <div className="divide-y divide-slate-100">
          {tenders.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedId(t.id)}
              className={cn(
                'flex w-full cursor-pointer flex-col gap-1 px-4 py-3 text-left transition-colors',
                selectedId === t.id
                  ? 'bg-bes-blue-50 border-l-2 border-l-bes-blue-500'
                  : 'hover:bg-slate-50 border-l-2 border-l-transparent'
              )}
            >
              <span className="line-clamp-2 text-sm font-medium text-bes-blue-950">
                {t.tender_name}
              </span>
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Building2 className="size-3" />
                <span className="truncate">{t.org_name || '-'}</span>
              </span>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {t.announcement_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {format(new Date(t.announcement_date), 'yyyy/MM/dd')}
                  </span>
                )}
                {t.files.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Paperclip className="size-3" />
                    {t.files.length}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 右側：選取案件的內容 */}
      <div className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
        {selected ? (
          <div className="space-y-6 p-4 sm:p-6">
            {/* 案件摘要 */}
            <div>
              {/* 手機返回按鈕 */}
              <button
                onClick={() => setSelectedId(null)}
                className="mb-3 flex items-center gap-1 text-sm text-slate-500 hover:text-bes-blue-600 lg:hidden"
              >
                <ChevronRight className="size-4 rotate-180" />
                返回列表
              </button>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="font-heading text-lg font-bold text-bes-blue-950">
                    {selected.tender_name}
                  </h1>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                    {selected.org_name && (
                      <span className="flex items-center gap-1">
                        <Building2 className="size-3.5" />
                        {selected.org_name}
                      </span>
                    )}
                    {selected.announcement_date && (
                      <span className="flex items-center gap-1">
                        <Calendar className="size-3.5" />
                        {format(new Date(selected.announcement_date), 'yyyy年MM月dd日')}
                      </span>
                    )}
                    {selected.budget && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="size-3.5" />
                        {formatBudget(selected.budget)}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleConvert}
                  disabled={converting || !selected.files.some(f => f.storage_path && f.download_status === 'success')}
                  className="shrink-0 cursor-pointer bg-gradient-to-r from-bes-blue-600 to-bes-green-500 font-semibold text-white shadow-md hover:from-bes-blue-700 hover:to-bes-green-600 disabled:opacity-50"
                >
                  {converting ? (
                    <Loader2 className="mr-1.5 size-4 animate-spin" />
                  ) : (
                    <ClipboardList className="mr-1.5 size-4" />
                  )}
                  {converting ? '轉換中...' : '建立備標作業'}
                </Button>
              </div>
            </div>

            {/* 附件檔案 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Paperclip className="size-5 text-bes-blue-500" />
                  附件檔案
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {selected.files.length} 個檔案
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileList
                  files={selected.files}
                  emptyText="此標案尚無附件檔案"
                  getDownloadUrl={file => file.downloadUrl}
                />
              </CardContent>
            </Card>

            {/* 轉換錯誤 */}
            {convertError && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="flex items-center gap-3 pt-6">
                  <AlertCircle className="size-5 shrink-0 text-red-500" />
                  <p className="text-sm text-red-700">{convertError}</p>
                </CardContent>
              </Card>
            )}

            {/* 轉換中 */}
            {converting && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="mb-3 size-8 animate-spin text-bes-blue-500" />
                  <p className="text-sm font-medium text-bes-blue-900">正在透過 AI 轉換文件...</p>
                  <p className="mt-1 text-xs text-slate-400">此過程可能需要數十秒，請耐心等候</p>
                </CardContent>
              </Card>
            )}

            {/* Markdown 結果 */}
            {markdown && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="size-5 text-bes-green-500" />
                    投標須知（AI 轉換）
                    <Badge className="ml-1 gap-1 bg-emerald-100 text-xs text-emerald-700 hover:bg-emerald-100">
                      <CheckCircle2 className="size-3" />
                      轉換完成
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="max-h-[600px] overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 sm:p-6">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                      {markdown}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="hidden flex-col items-center justify-center py-24 text-center lg:flex">
            <ChevronRight className="mb-3 size-10 text-slate-300" />
            <p className="text-sm text-slate-400">請從左側選擇一個收藏案件</p>
          </div>
        )}
      </div>
    </div>
  )
}
