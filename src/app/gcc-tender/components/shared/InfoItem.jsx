const COLOR_SCHEMES = {
  blue: {
    bg: 'bg-bes-blue-50/50',
    iconBg: 'bg-bes-blue-100',
    iconText: 'text-bes-blue-500',
    highlight: 'text-bes-blue-700',
    text: 'text-bes-blue-950',
  },
  emerald: {
    bg: 'bg-emerald-50/50',
    iconBg: 'bg-emerald-100',
    iconText: 'text-emerald-500',
    highlight: 'text-emerald-700',
    text: 'text-emerald-950',
  },
  rose: {
    bg: 'bg-rose-50/50',
    iconBg: 'bg-rose-100',
    iconText: 'text-rose-500',
    highlight: 'text-rose-700',
    text: 'text-rose-950',
  },
}

export default function InfoItem({ icon: Icon, label, value, highlight, colorScheme = 'blue' }) {
  if (!value || value === '-') return null
  const c = COLOR_SCHEMES[colorScheme] || COLOR_SCHEMES.blue
  return (
    <div className={`flex items-start gap-3 rounded-lg ${c.bg} p-3`}>
      <div className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md ${c.iconBg}`}>
        <Icon className={`size-4 ${c.iconText}`} />
      </div>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className={`text-base font-semibold ${highlight ? c.highlight : c.text}`}>
          {value}
        </p>
      </div>
    </div>
  )
}
