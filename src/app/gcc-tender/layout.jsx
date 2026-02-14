'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileSearch, ClipboardList } from 'lucide-react'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const navItems = [
  { title: '標案查詢', href: '/gcc-tender', icon: FileSearch },
  { title: '備標作業', href: '/gcc-tender/bid-prep', icon: ClipboardList },
]

function getBreadcrumbs(pathname) {
  if (pathname === '/gcc-tender') {
    return [{ label: '標案查詢' }]
  }
  if (pathname === '/gcc-tender/bid-prep') {
    return [{ label: '備標作業' }]
  }
  if (pathname.startsWith('/gcc-tender/tpread/')) {
    return [
      { label: '標案查詢', href: '/gcc-tender' },
      { label: '填寫頁面' },
    ]
  }
  // /gcc-tender/[id] 詳細頁
  if (pathname.startsWith('/gcc-tender/')) {
    return [
      { label: '標案查詢', href: '/gcc-tender' },
      { label: '標案詳細' },
    ]
  }
  return [{ label: '標案查詢' }]
}

export default function GccTenderLayout({ children }) {
  const pathname = usePathname()
  const breadcrumbs = getBreadcrumbs(pathname)

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3 px-2 py-3">
            <Image
              src="/logo.png"
              alt="中華工程"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-lg"
            />
            <div className="flex flex-col">
              <span className="font-heading text-sm font-semibold">中華工程</span>
              <span className="text-xs text-muted-foreground">公共工程投備標系統</span>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>功能選單</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const isActive =
                    item.href === '/gcc-tender'
                      ? pathname === '/gcc-tender' || (pathname.startsWith('/gcc-tender/') && !pathname.startsWith('/gcc-tender/bid-prep'))
                      : pathname.startsWith(item.href)
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                        <Link href={item.href}>
                          <item.icon />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset className="min-w-[640px] max-h-svh overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1
                return (
                  <span key={crumb.label} className="contents">
                    {index > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link href={crumb.href}>{crumb.label}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                )
              })}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="min-h-0 flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
