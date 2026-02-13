import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const ICON_COLORS = {
  blue: 'text-bes-blue-500',
  emerald: 'text-emerald-500',
  rose: 'text-rose-500',
}

export default function DetailCard({ icon: Icon, title, children, colorScheme = 'blue', badge }) {
  const iconColor = ICON_COLORS[colorScheme] || ICON_COLORS.blue
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {Icon && <Icon className={`size-5 ${iconColor}`} />}
          {title}
          {badge}
        </CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-slate-100">
        {children}
      </CardContent>
    </Card>
  )
}
