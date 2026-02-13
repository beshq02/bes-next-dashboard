'use client'

import { useState } from 'react'
import {
  Check, X, MapPin, Phone, Printer,
  Building2, Mail, Hash, FileText, Layers, Package, DollarSign,
  Scale, Globe, Zap, ShieldAlert, Shield, Eye, CirclePlus, Landmark,
  Gavel, Award, RefreshCw, CircleDot, Calendar, CalendarDays, CalendarClock,
  Users, Percent, Star, Target, MessageSquare,
  Download, Upload, FileEdit, Clock, Wallet, Type,
  Newspaper, FileCheck, TrendingUp, AlertTriangle, ClipboardList, CheckSquare,
  Info, AlertCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

// ─── 欄位 icon 對應 ─────────────────────────────────────────

const FIELD_ICONS = {
  // A 機關資料
  a02: Building2, a03: Building2, a04: MapPin,
  a05: Users, a06: Phone, a07: Printer, a08: Mail,
  // B 採購資料
  b01: Hash, b02: FileText, b03: Layers, b04: Hash,
  b05: Building2, b06: Package, b07: DollarSign, b08: ClipboardList,
  b09: Scale, b10: Globe, b11: Zap, b12: Package,
  b13: ShieldAlert, b14: Shield, b15: DollarSign, b16: Eye,
  b17: CirclePlus, b18: DollarSign, b19: Landmark, b20: Landmark,
  // C 招標資料
  c01: Gavel, c02: Award, c03: Scale,
  c04: RefreshCw, c05: Hash, c06: CircleDot,
  c07: Calendar, c08: CalendarDays, c09: CalendarClock,
  c10: Users, c11: DollarSign, c12: DollarSign,
  c13: Percent, c14: Star, c15: Eye, c16: Package,
  c17: Target, c18: FileText, c19: Users,
  c20: FileCheck, c21: MessageSquare, c22: Scale, c23: Scale,
  // D 領投開標資料
  d01: Download, d02: Upload, d03: FileEdit,
  d04: Clock, d05: CalendarClock, d06: MapPin,
  d07: Wallet, d08: Type, d09: MapPin,
  // D 子項目
  d01_01: DollarSign, d01_02: DollarSign, d01_03: DollarSign,
  d01_04: DollarSign, d01_05: Building2, d01_06: MapPin,
  // E 其他資料
  e01: Scale, e02: MapPin, e03: Calendar, e04: Newspaper,
  e05: FileCheck, e06: TrendingUp, e06_01: Percent,
  e07: AlertTriangle, e08: ClipboardList, e09: CheckSquare,
  e10: CheckSquare, e11: Info, e12: Globe, e13: AlertCircle,
}

function getFieldIcon(fieldCode) {
  return FIELD_ICONS[fieldCode] || FileText
}

// ─── 欄位設定 ────────────────────────────────────────────────

// 完全隱藏的欄位
const HIDDEN_FIELDS = new Set([
  'a01',      // 機關代碼
  'c02_01',   // 採購評選委員名單連結
  'd01_07',   // 投標須知下載連結
  'd01_08',   // 投標檔案名稱
  'd01_09',   // 投標檔案路徑
  'd01_10',   // Markdown 檔案路徑
  'd01_11',   // Markdown 轉換狀態
  'd01_12',   // Markdown 轉換時間
])

// 不顯示更新內容的欄位
const NO_CHANGE_FIELDS = new Set([
  'c04',  // 新增公告傳輸次數
  'c05',  // 更正序號
  'c08',  // 原公告日
  'd03',  // 是否異動招標文件
])

// 金額格式化欄位
const CURRENCY_FIELDS = new Set(['b15', 'd01_01', 'd01_02', 'd01_03', 'd01_04'])

// 變動時直接顯示前次資料的欄位（不需點擊按鈕）
const ALWAYS_SHOW_OLD_FIELDS = new Set(['c07', 'd04', 'd05'])

// UTC+8 日期時間欄位
const DATETIME_FIELDS = new Set(['d04', 'd05'])

// JSON 格式欄位（各自有專屬渲染元件）
const JSON_FIELDS = new Set(['b10', 'e13'])

// 子項目群組：父欄位 → 子欄位列表（依排序）
const SUB_ITEM_CHILDREN = {
  d01: ['d01_01', 'd01_02', 'd01_03', 'd01_04', 'd01_05', 'd01_06'],
}
// 所有被歸為子項目的欄位代碼（在主列表中跳過）
const ALL_CHILDREN = new Set(Object.values(SUB_ITEM_CHILDREN).flat())

// ─── 工具函數 ────────────────────────────────────────────────

function naturalSortFieldCode(a, b) {
  const re = /^([a-z]+)(\d+)(?:_(\d+))?$/i
  const ma = a.field_code.match(re)
  const mb = b.field_code.match(re)
  if (!ma || !mb) return a.field_code.localeCompare(b.field_code)
  if (ma[1] !== mb[1]) return ma[1].localeCompare(mb[1])
  const numA = parseInt(ma[2], 10)
  const numB = parseInt(mb[2], 10)
  if (numA !== numB) return numA - numB
  const subA = ma[3] != null ? parseInt(ma[3], 10) : -1
  const subB = mb[3] != null ? parseInt(mb[3], 10) : -1
  return subA - subB
}

function isFieldChanged(fieldCode, detail, previousDetail) {
  if (!previousDetail) return false
  if (NO_CHANGE_FIELDS.has(fieldCode)) return false
  const currVal = String(detail?.[fieldCode] ?? '')
  const prevVal = String(previousDetail?.[fieldCode] ?? '')
  return currVal !== prevVal
}

function formatCurrency(value) {
  if (value == null || value === '') return null
  const num = Number(String(value).replace(/,/g, ''))
  if (isNaN(num)) return String(value)
  return `NT$ ${num.toLocaleString('zh-TW')} 元`
}

function parseToTaipeiDate(value) {
  if (!value) return null
  try {
    let str = String(value)
    // 處理 Supabase 各種回傳格式：
    // "2025-11-17 09:00:00+00" / "2025-11-17T09:00:00+00:00" / "2025-11-17T09:00:00.000Z"
    str = str.replace(' ', 'T')
    if (/\+00$/.test(str)) str += ':00'
    const date = new Date(str)
    if (isNaN(date.getTime())) return null
    return date
  } catch (_e) {
    return null
  }
}

function formatDateTimeUTC8(value) {
  if (!value) return null
  const date = parseToTaipeiDate(value)
  if (!date) return String(value)
  const parts = new Intl.DateTimeFormat('zh-TW', {
    timeZone: 'Asia/Taipei',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const p = {}
  for (const { type, value: v } of parts) p[type] = v
  return `${p.year}年${p.month}月${p.day}日 ${p.hour}:${p.minute}`
}

function tryFormatDate(value) {
  const str = String(value)
  if (/\d{4}年\d{1,2}月\d{1,2}日/.test(str)) return str
  // YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/)
  if (isoMatch) {
    return `${isoMatch[1]}年${isoMatch[2].padStart(2, '0')}月${isoMatch[3].padStart(2, '0')}日`
  }
  // 民國日期 YYY/MM/DD
  const rocMatch = str.match(/^(\d{2,3})\/(\d{2})\/(\d{2})$/)
  if (rocMatch) {
    const year = parseInt(rocMatch[1], 10) + 1911
    return `${year}年${rocMatch[2]}月${rocMatch[3]}日`
  }
  return null
}

function formatValue(fieldCode, value) {
  if (value == null || value === '') return null
  if (CURRENCY_FIELDS.has(fieldCode)) return formatCurrency(value)
  if (DATETIME_FIELDS.has(fieldCode)) return formatDateTimeUTC8(value)
  const dateFormatted = tryFormatDate(String(value))
  if (dateFormatted) return dateFormatted
  return String(value)
}

function parseJsonField(value) {
  if (!value) return null
  if (typeof value === 'object') return value
  try {
    return JSON.parse(value)
  } catch (_e) {
    return null
  }
}

// ─── 條約或協定顯示 ─────────────────────────────────────────

function TreatyDisplay({ data }) {
  const parsed = parseJsonField(data)
  if (!parsed || typeof parsed !== 'object') {
    return <span className="text-sm">{String(data)}</span>
  }

  return (
    <div className="flex flex-col gap-2">
      {Object.entries(parsed).map(([treaty, applicable]) => {
        const isYes = applicable === '是'
        return (
          <div
            key={treaty}
            className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
              isYes
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-500'
            }`}
          >
            {isYes ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <X className="size-3.5 text-slate-400" />
            )}
            <span className={isYes ? 'font-medium' : ''}>{treaty}</span>
          </div>
        )
      })}
    </div>
  )
}

// ─── 是/否 顯示 ────────────────────────────────────────────

function BooleanDisplay({ value }) {
  const isYes = value === '是'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isYes
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {isYes ? (
        <Check className="size-3" />
      ) : (
        <X className="size-3" />
      )}
      {value}
    </span>
  )
}

function isBooleanValue(value) {
  return value === '是' || value === '否'
}

// ─── 受理單位顯示 ───────────────────────────────────────────

function parseContactInfo(text) {
  if (!text) return null
  const match = text.match(/^(.+?)-\((.+)\)$/)
  if (!match) return { name: text, details: null }
  const name = match[1]
  const raw = match[2]
  const addr = raw.match(/地址：([^、]+)/)?.[1] || null
  const phone = raw.match(/電話：([^、]+)/)?.[1] || null
  const fax = raw.match(/傳真：([^、)]+)/)?.[1] || null
  return { name, addr, phone, fax }
}

function ContactUnitDisplay({ data }) {
  const parsed = parseJsonField(data)
  if (!parsed || typeof parsed !== 'object') {
    return <span className="text-sm">{String(data)}</span>
  }

  return (
    <div className="space-y-3">
      {Object.entries(parsed).map(([label, value]) => {
        if (!value) return null
        const entries = String(value).split(/\\n|\n/).filter(Boolean)

        return (
          <div key={label} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 bg-slate-50 px-3 py-2">
              <p className="text-xs font-semibold text-slate-600">{label}</p>
            </div>
            <div className="divide-y divide-slate-100">
              {entries.map((entry, i) => {
                const info = parseContactInfo(entry.trim())
                if (!info) return null

                return (
                  <div key={i} className="px-3 py-2.5">
                    <p className="text-sm font-medium text-bes-blue-950">{info.name}</p>
                    {(info.addr || info.phone || info.fax) && (
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                        {info.addr && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="size-3 text-slate-400" />
                            {info.addr}
                          </span>
                        )}
                        {info.phone && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Phone className="size-3 text-slate-400" />
                            {info.phone}
                          </span>
                        )}
                        {info.fax && (
                          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                            <Printer className="size-3 text-slate-400" />
                            {info.fax}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── 子項目群組顯示 ─────────────────────────────────────────

function SubItemGroup({ parentField, detail, previousDetail, fieldMapping }) {
  const childCodes = SUB_ITEM_CHILDREN[parentField.field_code] || []
  const childFields = childCodes
    .map(code => fieldMapping.find(f => f.field_code === code))
    .filter(Boolean)

  const parentValue = detail?.[parentField.field_code]
  const parentChanged = isFieldChanged(parentField.field_code, detail, previousDetail)
  const ParentIcon = getFieldIcon(parentField.field_code)

  return (
    <div className={`rounded px-2 py-2.5 ${parentChanged ? 'bg-amber-50/30' : 'bg-white'}`}>
      {/* 父欄位 */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
          <ParentIcon className="size-3.5 shrink-0 text-slate-400" />
          {parentField.field_name}
          {parentChanged && (
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0"
            >
              已更新
            </Badge>
          )}
        </dt>
        <dd className="text-sm font-medium text-bes-blue-950 sm:col-span-2">
          {isBooleanValue(parentValue) ? (
            <BooleanDisplay value={parentValue} />
          ) : (
            parentValue || <span className="text-slate-300">—</span>
          )}
        </dd>
      </div>

      {/* 子項目 */}
      {childFields.length > 0 && (
        <div className="mt-2 ml-2 rounded-lg border border-slate-200 bg-slate-50/80">
          {childFields.map((child, i) => {
            const val = detail?.[child.field_code]
            const formatted = formatValue(child.field_code, val)
            const childChanged = isFieldChanged(child.field_code, detail, previousDetail)
            const ChildIcon = getFieldIcon(child.field_code)
            return (
              <div
                key={child.field_code}
                className={`grid grid-cols-1 gap-1 px-3 py-2 sm:grid-cols-[180px_1fr] ${
                  i < childFields.length - 1 ? 'border-b border-slate-200/60' : ''
                } ${childChanged ? 'bg-amber-50/40' : ''}`}
              >
                <dt className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <ChildIcon className="size-3 shrink-0 text-slate-400" />
                  {child.field_name}
                  {childChanged && (
                    <Badge
                      variant="outline"
                      className="border-amber-300 bg-amber-50 text-amber-600 text-[9px] px-1 py-0"
                    >
                      更新
                    </Badge>
                  )}
                </dt>
                <dd className="text-sm text-bes-blue-950">
                  {isBooleanValue(val) ? (
                    <BooleanDisplay value={val} />
                  ) : (
                    formatted || <span className="text-slate-300">—</span>
                  )}
                </dd>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 一般欄位列 ─────────────────────────────────────────────

function FieldRow({ field, detail, previousDetail, index }) {
  const [showOldValue, setShowOldValue] = useState(false)
  const value = detail?.[field.field_code]
  const changed = isFieldChanged(field.field_code, detail, previousDetail)
  const oldValue = previousDetail?.[field.field_code]
  const isJsonField = JSON_FIELDS.has(field.field_code)
  const formatted = formatValue(field.field_code, value)
  const Icon = getFieldIcon(field.field_code)
  const alwaysShowOld = ALWAYS_SHOW_OLD_FIELDS.has(field.field_code)
  const oldVisible = changed && (alwaysShowOld || showOldValue)

  return (
    <div
      className={`grid grid-cols-1 gap-2 border-b border-slate-100 py-2.5 last:border-0 ${field.field_code === 'e13' ? '' : 'sm:grid-cols-3'} ${
        changed ? 'bg-amber-50/30' : ''
      } ${!changed && index % 2 === 0 ? 'bg-white' : !changed ? 'bg-slate-50' : ''} rounded px-2 transition-colors hover:bg-bes-blue-50/30`}
    >
      <dt className="flex items-center gap-2 text-sm font-medium text-slate-500">
        <Icon className="size-3.5 shrink-0 text-slate-400" />
        {field.field_name}
        {changed && !alwaysShowOld && (
          <button
            type="button"
            onClick={() => setShowOldValue(prev => !prev)}
            className="shrink-0 cursor-pointer"
          >
            <Badge
              variant="outline"
              className="border-amber-300 bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0 hover:bg-amber-100 transition-colors"
            >
              已更新
            </Badge>
          </button>
        )}
        {changed && alwaysShowOld && (
          <Badge
            variant="outline"
            className="shrink-0 border-amber-300 bg-amber-50 text-amber-600 text-[10px] px-1.5 py-0"
          >
            已更新
          </Badge>
        )}
      </dt>
      <dd className={`break-words text-sm text-bes-blue-950 ${field.category !== 'A' ? 'whitespace-pre-wrap' : ''} ${field.field_code === 'e13' ? 'mt-1' : 'sm:col-span-2'}`}>
        {field.field_code === 'e13' ? (
          <ContactUnitDisplay data={value} />
        ) : isJsonField ? (
          <TreatyDisplay data={value} />
        ) : isBooleanValue(value) ? (
          <BooleanDisplay value={value} />
        ) : (
          (typeof formatted === 'string' ? formatted.replace(/\\n/g, '\n') : formatted) || <span className="text-slate-300">—</span>
        )}
        {oldVisible && (
          <div className="mt-1 whitespace-pre-wrap text-xs text-slate-400">
            {oldValue != null && oldValue !== '' ? ((formatValue(field.field_code, oldValue) || String(oldValue)).replace(/\\n/g, '\n')) : '（無）'}
          </div>
        )}
      </dd>
    </div>
  )
}

// ─── 主元件 ─────────────────────────────────────────────────

export default function DetailSection({ title, detail, fieldMapping, previousDetail }) {
  const categoryFields = fieldMapping.filter(f => f.category === title)

  if (categoryFields.length === 0) return null

  const visibleFields = categoryFields
    .filter(f => !HIDDEN_FIELDS.has(f.field_code) && !ALL_CHILDREN.has(f.field_code))
    .sort(naturalSortFieldCode)

  if (visibleFields.length === 0) return null

  return (
    <div className="space-y-0">
      {visibleFields.map((field, index) => {
        // 有子項目群組的父欄位
        if (SUB_ITEM_CHILDREN[field.field_code]) {
          return (
            <SubItemGroup
              key={field.field_code}
              parentField={field}
              detail={detail}
              previousDetail={previousDetail}
              fieldMapping={fieldMapping}
            />
          )
        }

        return (
          <FieldRow
            key={field.field_code}
            field={field}
            detail={detail}
            previousDetail={previousDetail}
            index={index}
          />
        )
      })}
    </div>
  )
}
