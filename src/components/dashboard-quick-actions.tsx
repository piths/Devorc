"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  IconLayoutKanban,
  IconMessageCircle,
  IconBrandGithub,
  IconLayoutGrid,
  IconVectorBezier,
} from "@tabler/icons-react"

export function DashboardQuickActions() {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardContent className="flex flex-wrap gap-2 p-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard/github">
              <IconBrandGithub />
              GitHub Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/kanban">
              <IconLayoutKanban />
              Kanban
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/chat">
              <IconMessageCircle />
              Chat
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/overview">
              <IconLayoutGrid />
              Overview
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/canvas">
              <IconVectorBezier />
              Canvas
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

