import { ExternalLink, Building2, Calendar, FileText, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { getProcurementLevelBadge } from '../../lib/utils'

export default function TenderSummaryCard({ announcement, procurementLevel, historyCount }) {
  const summaryItems = [
    {
      icon: Building2,
      label: '機關名稱',
      value: announcement.org_name || '-',
    },
    {
      icon: Calendar,
      label: '公告日期',
      value: announcement.announcement_date || '-',
    },
    {
      icon: FileText,
      label: '截止投標',
      value: announcement.deadline || '-',
    },
    {
      icon: DollarSign,
      label: '預算金額',
      value: announcement.budget ? `NT$ ${announcement.budget}` : '-',
      highlight: !!announcement.budget,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <CardTitle className="font-heading text-xl leading-relaxed">
              {announcement.tender_name}
            </CardTitle>
            {announcement.tender_no && (
              <CardDescription>案號：{announcement.tender_no}</CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            {getProcurementLevelBadge(procurementLevel)}
            {historyCount > 1 && (
              <Badge variant="secondary">
                {historyCount} 次公告
              </Badge>
            )}
            {announcement.detail_url && (
              <Button variant="outline" size="sm" asChild className="cursor-pointer border-amber-500 text-amber-700 hover:bg-amber-50">
                <a href={announcement.detail_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1 h-4 w-4" />
                  政府採購網
                </a>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {summaryItems.map(({ icon: Icon, label, value, highlight }) => (
            <div key={label} className="flex items-start gap-3 rounded-lg bg-bes-blue-50/50 p-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-bes-blue-100">
                <Icon className="h-4 w-4 text-bes-blue-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className={`text-sm font-medium ${highlight ? 'text-bes-blue-700' : 'text-bes-blue-950'}`}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
          <div>
            <p className="text-slate-500">招標方式</p>
            <p className="font-medium">{announcement.tender_method || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500">採購性質</p>
            <p className="font-medium">{announcement.procurement_nature || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500">傳輸次數</p>
            <p className="font-medium">{announcement.transmission_count || '-'}</p>
          </div>
          <div>
            <p className="text-slate-500">是否更正</p>
            <p className="font-medium">{announcement.is_correction ? '是' : '否'}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
