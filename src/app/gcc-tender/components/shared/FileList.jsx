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
import { AlertCircle, CheckCircle2, Clock, Download, Paperclip } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

export default function FileList({ files, emptyText, getDownloadUrl }) {
  if (!files || files.length === 0) {
    return (
      <div className="py-6 text-center">
        <Paperclip className="mx-auto mb-2 size-8 text-slate-300" />
        <p className="text-sm text-slate-400">{emptyText || '尚無附件檔案'}</p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-slate-100">
      {files.map((file, idx) => {
        const ft = getFileTypeStyle(file.file_extension)
        const ExtIcon = ft.icon
        const isLargeFile = file.file_size != null && file.file_size >= 52428800
        const downloadUrl = getDownloadUrl?.(file)

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
            <div className="flex shrink-0 items-center gap-2">
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
              {file.download_status === 'success' && downloadUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-7 cursor-pointer gap-1 border-emerald-300 px-2.5 text-xs text-emerald-700 hover:bg-emerald-50"
                >
                  <a href={downloadUrl} download={file.file_name}>
                    <Download className="size-3" />
                    下載
                  </a>
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
