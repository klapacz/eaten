import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import {
  IconCalendar,
  IconChevronsY,
  IconDashboardFill,
  IconHeadphonesFill,
  IconLogout,
  IconSettingsFill,
  IconShieldFill,
} from '@intentui/icons'
import { Avatar } from '@/components/ui/avatar'
import { Link } from '@/components/ui/link'
import {
  Menu,
  MenuContent,
  MenuHeader,
  MenuItem,
  MenuSection,
  MenuSeparator,
  MenuTrigger,
} from '@/components/ui/menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarItem,
  SidebarLabel,
  SidebarProvider,
  SidebarRail,
  SidebarSection,
  SidebarSectionGroup,
} from '@/components/ui/sidebar'
import { authClient } from '@/auth/client'

export const Route = createFileRoute('/_app')({
  component: RouteComponent,
  loader: async () => {
    const session = await authClient.getSession()
    if (!session.data) {
      throw redirect({ to: '/auth/login' })
    }
  },
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AppSidebar collapsible="dock" />
      <SidebarInset>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  )
}

export default function AppSidebar(
  props: React.ComponentProps<typeof Sidebar>,
) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <Link to="/calendar" className="flex items-center gap-x-2">
          <SidebarLabel className="font-medium">Eaten</SidebarLabel>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarSectionGroup>
          <SidebarSection label="Overview">
            {/* TODO: `to` not typed in SidebarItem */}
            <SidebarItem tooltip="Overview" to="/calendar">
              <IconCalendar />
              <SidebarLabel>Calendar</SidebarLabel>
            </SidebarItem>

            <SidebarItem tooltip="Overview" to="/meal">
              <IconCalendar />
              <SidebarLabel>Meals</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
        </SidebarSectionGroup>
      </SidebarContent>

      <SidebarFooter className="flex flex-row justify-between gap-4 group-data-[state=collapsed]:flex-col">
        <Menu>
          <MenuTrigger
            className="flex w-full items-center justify-between"
            aria-label="Profile"
          >
            <div className="flex items-center gap-x-2">
              <Avatar
                className="size-8 *:size-8 group-data-[state=collapsed]:size-6 group-data-[state=collapsed]:*:size-6"
                isSquare
                src="https://intentui.com/images/avatar/cobain.jpg"
              />

              <div className="in-data-[collapsible=dock]:hidden text-sm">
                <SidebarLabel>Kurt Cobain</SidebarLabel>
                <span className="-mt-0.5 block text-muted-fg">
                  kurt@domain.com
                </span>
              </div>
            </div>
            <IconChevronsY data-slot="chevron" />
          </MenuTrigger>
          <MenuContent
            className="in-data-[sidebar-collapsible=collapsed]:min-w-56 min-w-(--trigger-width)"
            placement="bottom right"
          >
            <MenuSection>
              <MenuHeader separator>
                <span className="block">Kurt Cobain</span>
                <span className="font-normal text-muted-fg">@cobain</span>
              </MenuHeader>
            </MenuSection>

            <MenuItem href="#dashboard">
              <IconDashboardFill />
              Dashboard
            </MenuItem>
            <MenuItem href="#settings">
              <IconSettingsFill />
              Settings
            </MenuItem>
            <MenuItem href="#security">
              <IconShieldFill />
              Security
            </MenuItem>
            <MenuSeparator />

            <MenuItem href="#contact">
              <IconHeadphonesFill />
              Customer Support
            </MenuItem>
            <MenuSeparator />
            <MenuItem href="#logout">
              <IconLogout />
              Log out
            </MenuItem>
          </MenuContent>
        </Menu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
