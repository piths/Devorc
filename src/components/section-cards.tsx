import { z } from "zod"
import {
  IconTrendingDown,
  IconTrendingUp,
  IconUserExclamation,
  IconAlertTriangle,
} from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { schema } from "@/components/data-table"

type Item = z.infer<typeof schema>

export function SectionCards({ data }: { data?: Item[] }) {
  const total = data?.length ?? 0
  const completed = data?.filter((d) => d.status === "Done").length ?? 0
  const inProgress = data?.filter((d) => d.status.includes("In")).length ?? 0
  const unassigned = data?.filter((d) => d.reviewer === "Assign reviewer").length ?? 0
  const overLimit = data?.filter((d) => Number(d.target) > Number(d.limit)).length ?? 0

  const completionRate = total ? Math.round((completed / total) * 100) : 0

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completed Sections</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {completed} / {total}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              {completionRate}%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            On track <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Overall completion rate</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>In Progress</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {inProgress}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconTrendingUp />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Work underway <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Moving towards completion</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Unassigned Reviews</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {unassigned}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUserExclamation />
              Needs attention
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Assign reviewers promptly
          </div>
          <div className="text-muted-foreground">Keep review flow unblocked</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Over Limit</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {overLimit}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconAlertTriangle />
              Check targets
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Adjust scope or limits <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Targets exceed limits</div>
        </CardFooter>
      </Card>
    </div>
  )
}
