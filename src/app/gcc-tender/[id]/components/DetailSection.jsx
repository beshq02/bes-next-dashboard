'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

function isFieldChanged(fieldCode, detail, previousDetail) {
  if (!previousDetail) return false
  const currVal = String(detail?.[fieldCode] ?? '')
  const prevVal = String(previousDetail?.[fieldCode] ?? '')
  return currVal !== prevVal
}

function FieldRow({ field, detail, previousDetail, index }) {
  const [showOldValue, setShowOldValue] = useState(false)
  const value = detail?.[field.field_code]
  const changed = isFieldChanged(field.field_code, detail, previousDetail)
  const oldValue = previousDetail?.[field.field_code]

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-slate-100 py-2.5 last:border-0 sm:grid-cols-3 ${
        changed ? 'border-l-2 border-l-amber-400 bg-amber-50/30' : ''
      } ${!changed && index % 2 === 0 ? 'bg-white' : !changed ? 'bg-slate-50/50' : ''} rounded px-2 transition-colors hover:bg-bes-blue-50/30`}
    >
      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
        {field.field_name}
        {changed && (
          <button
            type="button"
            onClick={() => setShowOldValue(prev => !prev)}
            className="cursor-pointer"
          >
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0 hover:bg-amber-100 transition-colors"
            >
              已更新
            </Badge>
          </button>
        )}
      </dt>
      <dd className="break-words text-sm text-bes-blue-950 sm:col-span-2">
        {field.field_code === 'c2_1' && value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-bes-blue-600 hover:underline"
          >
            查看連結 <ExternalLink className="h-3 w-3" />
          </a>
        ) : field.field_code === 'd1_7' && value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-bes-blue-600 hover:underline"
          >
            下載投標須知 <ExternalLink className="h-3 w-3" />
          </a>
        ) : (
          value
        )}
        {changed && showOldValue && (
          <div className="mt-1 text-xs text-slate-400 line-through">
            原：{oldValue !== null && oldValue !== undefined && oldValue !== '' ? String(oldValue) : '（無）'}
          </div>
        )}
      </dd>
    </div>
  )
}

export default function DetailSection({ title, detail, fieldMapping, previousDetail }) {
  const categoryFields = fieldMapping.filter(f => f.category === title)

  if (categoryFields.length === 0) return null

  const validFields = categoryFields.filter(f => {
    const value = detail?.[f.field_code]
    return value !== null && value !== undefined && value !== ''
  })

  if (validFields.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500">
        <p>此類別無資料</p>
      </div>
    )
  }

  return (
    <div className="space-y-0">
      {validFields.map((field, index) => (
        <FieldRow
          key={field.field_code}
          field={field}
          detail={detail}
          previousDetail={previousDetail}
          index={index}
        />
      ))}
    </div>
  )
}
