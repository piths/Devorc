"use client"

import {
  IconChevronRight,
  type Icon,
} from "@tabler/icons-react"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavDocuments({
  title,
  items,
}: {
  title?: string
  items: Array<{
    name?: string
    title?: string
    url: string
    icon: Icon
    items?: Array<{
      title: string
      url: string
      icon?: Icon
    }>
    isActive?: boolean
  }>
}) {

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      {title && <SidebarGroupLabel className="text-xs font-medium text-sidebar-foreground/70 px-2 py-1">{title}</SidebarGroupLabel>}
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const itemName = item.name || item.title || ''
          
          if (item.items && item.items.length > 0) {
            return (
              <Collapsible
                key={itemName}
                asChild
                defaultOpen={item.isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={itemName} className="h-8 px-3">
                      <item.icon className="h-4 w-4" />
                      <span className="text-sm">{itemName}</span>
                      <IconChevronRight className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub className="ml-2 space-y-1">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild className="h-7 px-3">
                            <a href={subItem.url}>
                              {subItem.icon && <subItem.icon className="h-3.5 w-3.5" />}
                              <span className="text-xs">{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )
          }

          return (
            <SidebarMenuItem key={itemName}>
              <SidebarMenuButton asChild tooltip={itemName} className="h-8 px-3">
                <a href={item.url} className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm">{itemName}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
