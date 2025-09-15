"use client"

import { type Icon } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: Icon
    isActive?: boolean
    badge?: string
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu className="space-y-1">
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                tooltip={item.title}
                isActive={item.isActive}
                asChild={!!item.url && item.url !== "#"}
                className="h-9 px-3"
              >
                {item.url && item.url !== "#" ? (
                  <a href={item.url} className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </a>
                ) : (
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      {item.icon && <item.icon className="h-4 w-4" />}
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0.5">
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                )}
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
