'use client'

import { Breadcrumbs } from '@/components/ui/breadcrumbs'
import { SidebarNav, SidebarTrigger } from '@/components/ui/sidebar'

export default function AppSidebarNav() {
  return (
    <SidebarNav>
      <span className="flex items-center gap-x-4">
        <SidebarTrigger className="-ml-2" />
        <Breadcrumbs className="hidden md:flex">
          <Breadcrumbs.Item href="/">Dashboard</Breadcrumbs.Item>
          <Breadcrumbs.Item>Meals</Breadcrumbs.Item>
        </Breadcrumbs>
      </span>
    </SidebarNav>
  )
}
