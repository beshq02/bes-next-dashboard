import { Badge } from '@/components/ui/badge'

/**
 * 招標類型 Badge 樣式
 */
const TENDER_TYPE_STYLES = {
  '招標公告': 'bg-bes-blue-500 text-white hover:bg-bes-blue-600',
  '公開閱覽': 'bg-violet-500 text-white hover:bg-violet-600',
  '決標公告': 'bg-emerald-500 text-white hover:bg-emerald-600',
  '無法決標': 'bg-rose-500 text-white hover:bg-rose-600',
}

/**
 * 招標類型 Badge
 */
export function getTenderTypeBadge(typeName) {
  if (!typeName) return null
  const className = TENDER_TYPE_STYLES[typeName] || 'bg-slate-500 text-white hover:bg-slate-600'
  return <Badge className={className}>{typeName}</Badge>
}

/**
 * 格式化預算金額（完整版，表格 / 詳情頁用）
 */
export function formatBudget(budget) {
  if (!budget) return '-'
  const num = parseFloat(String(budget).replace(/,/g, ''))
  if (isNaN(num)) return budget

  if (num >= 100000000) {
    return `${(Math.round(num / 10000000) / 10).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 億`
  }
  if (num >= 10000000) {
    return `${(Math.round(num / 1000000) / 10).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 千萬`
  }
  if (num >= 1000000) {
    return `${(Math.round(num / 100000) / 10).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 百萬`
  }
  if (num >= 10000) {
    return `${(Math.round(num / 1000) / 10).toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 萬`
  }
  return num.toLocaleString('zh-TW', { maximumFractionDigits: 1 })
}

/**
 * 格式化金額（簡化版，MetricCards 用）
 */
export function formatAmount(amount) {
  if (!amount || amount === 0) return '0'

  if (amount >= 100000000) {
    return `${(amount / 100000000).toFixed(1)} 億`
  }
  if (amount >= 10000) {
    return `${(amount / 10000).toFixed(0)} 萬`
  }
  return amount.toLocaleString()
}

/**
 * 招標類型列底色（表格用）
 */
const TENDER_TYPE_ROW_STYLES = {
  '招標公告': 'bg-blue-50/60 hover:bg-blue-100/60',
  '公開閱覽': 'bg-violet-50/60 hover:bg-violet-100/60',
  '決標公告': 'bg-emerald-50/60 hover:bg-emerald-100/60',
  '無法決標': 'bg-rose-50/60 hover:bg-rose-100/60',
}

export function getTenderTypeRowStyle(typeName) {
  return TENDER_TYPE_ROW_STYLES[typeName] || ''
}

/**
 * 採購級距 Badge（品牌色版本）
 */
export function getProcurementLevelBadge(level) {
  if (!level) {
    return (
      <Badge variant="outline" className="text-slate-400">
        未分類
      </Badge>
    )
  }
  if (level === '巨額') {
    return <Badge className="bg-amber-500 text-white hover:bg-amber-600">巨額</Badge>
  }
  if (level.includes('查核金額')) {
    return <Badge className="bg-bes-blue-500 text-white hover:bg-bes-blue-600">查核金額以上</Badge>
  }
  if (level.includes('公告金額')) {
    return <Badge className="bg-sky-500 text-white hover:bg-sky-600">公告金額以上</Badge>
  }
  return <Badge variant="secondary">{level}</Badge>
}
