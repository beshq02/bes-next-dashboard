import { Check, X } from 'lucide-react'

function BooleanBadge({ value }) {
  const isYes = value === '是'
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        isYes
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      {isYes ? <Check className="size-3" /> : <X className="size-3" />}
      {value}
    </span>
  )
}

export default function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null
  const isBool = value === '是' || value === '否'
  return (
    <div className="grid grid-cols-[auto_1fr] gap-4 rounded px-2 py-2 odd:bg-white even:bg-slate-50 transition-colors hover:bg-bes-blue-50/30">
      <span className="flex items-center gap-1.5 text-sm text-slate-500">
        {Icon && <Icon className="size-3.5 text-slate-400" />}
        {label}
      </span>
      <span className="whitespace-pre-wrap text-sm font-medium">
        {isBool ? <BooleanBadge value={value} /> : (typeof value === 'string' ? value.replace(/\\n/g, '\n') : value)}
      </span>
    </div>
  )
}
