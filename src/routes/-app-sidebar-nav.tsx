'use client'

import { SidebarNav, SidebarTrigger } from '@/components/ui/sidebar'

export default function AppSidebarNav({
  children,
  ...props
}: React.ComponentProps<typeof SidebarNav>) {
  return (
    <SidebarNav {...props}>
      <SidebarTrigger className="-ml-2" />
      <div className="flex justify-between gap-2 grow">{children}</div>
    </SidebarNav>
  )
}
