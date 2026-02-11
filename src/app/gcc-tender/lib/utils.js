import { Badge } from '@/components/ui/badge'

/**
 * 格式化預算金額（完整版，表格 / 詳情頁用）
 */
export function formatBudget(budget) {
  if (!budget) return '-'
  const num = parseFloat(String(budget).replace(/,/g, ''))
  if (isNaN(num)) return budget

  if (num >= 100000000) {
    return `${(num / 100000000).toFixed(2)} 億`
  }
  if (num >= 10000) {
    return `${(num / 10000).toFixed(0)} 萬`
  }
  return num.toLocaleString()
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
  return <Badge variant="secondary">{level}</Badge>
}
