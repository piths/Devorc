"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { IconLayoutKanban, IconPlus } from "@tabler/icons-react"

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { LocalStorageManager } from "@/lib/storage/LocalStorageManager"
import { KanbanBoard } from "@/types/storage"

export function NavBoards() {
  const { isMobile } = useSidebar()
  const router = useRouter()
  const params = useSearchParams()
  const selected = params.get("board") || "default-board"

  const [boards, setBoards] = React.useState<KanbanBoard[]>([])

  React.useEffect(() => {
    const load = async () => {
      const storage = LocalStorageManager.getInstance()
      const res = await storage.loadKanbanBoards()
      if (res.success && res.data) {
        const sorted = [...res.data].sort((a, b) => (
          new Date(a.updatedAt).getTime() > new Date(b.updatedAt).getTime() ? -1 : 1
        ))
        setBoards(sorted)
      }
    }
    load()
  }, [])

  const handleSelect = (id: string) => {
    const url = new URL(window.location.href)
    url.searchParams.set("board", id)
    router.replace(url.pathname + url.search)
  }

  const top = boards.slice(0, 6)

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <div className="flex items-center justify-between pr-2">
        <SidebarGroupLabel asChild>
          <div className="flex items-center gap-2">
            <IconLayoutKanban className="size-4" />
            <span>Boards</span>
          </div>
        </SidebarGroupLabel>
        <Button
          variant="ghost"
          size="icon"
          className="size-6"
          onClick={() => router.push("/kanban")}
          title="Manage boards"
        >
          <IconPlus className="size-4" />
        </Button>
      </div>
      <SidebarMenu>
        {top.map((b) => (
          <SidebarMenuItem key={b.id}>
            <SidebarMenuButton
              tooltip={b.name}
              isActive={selected === b.id}
              onClick={() => handleSelect(b.id)}
            >
              <IconLayoutKanban />
              <span className="truncate">{b.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        {boards.length === 0 && (
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <IconLayoutKanban />
              <span>No boards yet</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}

