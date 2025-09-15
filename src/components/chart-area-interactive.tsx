"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"

export const description = "An interactive area chart"

const chartData = [
  { date: "2024-04-01", completed: 12, inProgress: 8, total: 68 },
  { date: "2024-04-02", completed: 14, inProgress: 9, total: 68 },
  { date: "2024-04-03", completed: 16, inProgress: 10, total: 68 },
  { date: "2024-04-04", completed: 18, inProgress: 11, total: 68 },
  { date: "2024-04-05", completed: 20, inProgress: 12, total: 68 },
  { date: "2024-04-06", completed: 22, inProgress: 13, total: 68 },
  { date: "2024-04-07", completed: 24, inProgress: 14, total: 68 },
  { date: "2024-04-08", completed: 26, inProgress: 15, total: 68 },
  { date: "2024-04-09", completed: 28, inProgress: 16, total: 68 },
  { date: "2024-04-10", completed: 30, inProgress: 17, total: 68 },
  { date: "2024-04-11", completed: 32, inProgress: 18, total: 68 },
  { date: "2024-04-12", completed: 34, inProgress: 19, total: 68 },
  { date: "2024-04-13", completed: 36, inProgress: 20, total: 68 },
  { date: "2024-04-14", completed: 38, inProgress: 21, total: 68 },
  { date: "2024-04-15", completed: 40, inProgress: 22, total: 68 },
  { date: "2024-04-16", completed: 42, inProgress: 23, total: 68 },
  { date: "2024-04-17", completed: 44, inProgress: 24, total: 68 },
  { date: "2024-04-18", completed: 46, inProgress: 25, total: 68 },
  { date: "2024-04-19", completed: 48, inProgress: 26, total: 68 },
  { date: "2024-04-20", completed: 50, inProgress: 27, total: 68 },
  { date: "2024-04-21", completed: 52, inProgress: 28, total: 68 },
  { date: "2024-04-22", completed: 54, inProgress: 29, total: 68 },
  { date: "2024-04-23", completed: 56, inProgress: 30, total: 68 },
  { date: "2024-04-24", completed: 58, inProgress: 31, total: 68 },
  { date: "2024-04-25", completed: 60, inProgress: 32, total: 68 },
  { date: "2024-04-26", completed: 62, inProgress: 33, total: 68 },
  { date: "2024-04-27", completed: 64, inProgress: 34, total: 68 },
  { date: "2024-04-28", completed: 66, inProgress: 35, total: 68 },
  { date: "2024-04-29", completed: 68, inProgress: 36, total: 68 },
  { date: "2024-04-30", completed: 70, inProgress: 38, total: 68 },
  { date: "2024-05-01", completed: 72, inProgress: 40, total: 68 },
  { date: "2024-05-02", completed: 74, inProgress: 42, total: 68 },
  { date: "2024-05-03", completed: 76, inProgress: 44, total: 68 },
  { date: "2024-05-04", completed: 78, inProgress: 46, total: 68 },
  { date: "2024-05-05", completed: 80, inProgress: 48, total: 68 },
  { date: "2024-05-06", completed: 82, inProgress: 50, total: 68 },
  { date: "2024-05-07", completed: 84, inProgress: 52, total: 68 },
  { date: "2024-05-08", completed: 86, inProgress: 54, total: 68 },
  { date: "2024-05-09", completed: 88, inProgress: 56, total: 68 },
  { date: "2024-05-10", completed: 90, inProgress: 58, total: 68 },
  { date: "2024-05-11", completed: 92, inProgress: 60, total: 68 },
  { date: "2024-05-12", completed: 94, inProgress: 62, total: 68 },
  { date: "2024-05-13", completed: 96, inProgress: 64, total: 68 },
  { date: "2024-05-14", completed: 98, inProgress: 66, total: 68 },
  { date: "2024-05-15", completed: 100, inProgress: 68, total: 68 },
  { date: "2024-05-16", completed: 102, inProgress: 70, total: 68 },
  { date: "2024-05-17", completed: 104, inProgress: 72, total: 68 },
  { date: "2024-05-18", completed: 106, inProgress: 74, total: 68 },
  { date: "2024-05-19", completed: 108, inProgress: 76, total: 68 },
  { date: "2024-05-20", completed: 110, inProgress: 78, total: 68 },
  { date: "2024-05-21", completed: 112, inProgress: 80, total: 68 },
  { date: "2024-05-22", completed: 114, inProgress: 82, total: 68 },
  { date: "2024-05-23", completed: 116, inProgress: 84, total: 68 },
  { date: "2024-05-24", completed: 118, inProgress: 86, total: 68 },
  { date: "2024-05-25", completed: 120, inProgress: 88, total: 68 },
  { date: "2024-05-26", completed: 122, inProgress: 90, total: 68 },
  { date: "2024-05-27", completed: 124, inProgress: 92, total: 68 },
  { date: "2024-05-28", completed: 126, inProgress: 94, total: 68 },
  { date: "2024-05-29", completed: 128, inProgress: 96, total: 68 },
  { date: "2024-05-30", completed: 130, inProgress: 98, total: 68 },
  { date: "2024-05-31", completed: 132, inProgress: 100, total: 68 },
  { date: "2024-06-01", completed: 134, inProgress: 102, total: 68 },
  { date: "2024-06-02", completed: 136, inProgress: 104, total: 68 },
  { date: "2024-06-03", completed: 138, inProgress: 106, total: 68 },
  { date: "2024-06-04", completed: 140, inProgress: 108, total: 68 },
  { date: "2024-06-05", completed: 142, inProgress: 110, total: 68 },
  { date: "2024-06-06", completed: 144, inProgress: 112, total: 68 },
  { date: "2024-06-07", completed: 146, inProgress: 114, total: 68 },
  { date: "2024-06-08", completed: 148, inProgress: 116, total: 68 },
  { date: "2024-06-09", completed: 150, inProgress: 118, total: 68 },
  { date: "2024-06-10", completed: 152, inProgress: 120, total: 68 },
  { date: "2024-06-11", completed: 154, inProgress: 122, total: 68 },
  { date: "2024-06-12", completed: 156, inProgress: 124, total: 68 },
  { date: "2024-06-13", completed: 158, inProgress: 126, total: 68 },
  { date: "2024-06-14", completed: 160, inProgress: 128, total: 68 },
  { date: "2024-06-15", completed: 162, inProgress: 130, total: 68 },
  { date: "2024-06-16", completed: 164, inProgress: 132, total: 68 },
  { date: "2024-06-17", completed: 166, inProgress: 134, total: 68 },
  { date: "2024-06-18", completed: 168, inProgress: 136, total: 68 },
  { date: "2024-06-19", completed: 170, inProgress: 138, total: 68 },
  { date: "2024-06-20", completed: 172, inProgress: 140, total: 68 },
  { date: "2024-06-21", completed: 174, inProgress: 142, total: 68 },
  { date: "2024-06-22", completed: 176, inProgress: 144, total: 68 },
  { date: "2024-06-23", completed: 178, inProgress: 146, total: 68 },
  { date: "2024-06-24", completed: 180, inProgress: 148, total: 68 },
  { date: "2024-06-25", completed: 182, inProgress: 150, total: 68 },
  { date: "2024-06-26", completed: 184, inProgress: 152, total: 68 },
  { date: "2024-06-27", completed: 186, inProgress: 154, total: 68 },
  { date: "2024-06-28", completed: 188, inProgress: 156, total: 68 },
  { date: "2024-06-29", completed: 190, inProgress: 158, total: 68 },
  { date: "2024-06-30", completed: 192, inProgress: 160, total: 68 },
]

const chartConfig = {
  completed: {
    label: "Completed Tasks",
    color: "hsl(var(--chart-1))",
  },
  inProgress: {
    label: "In Progress",
    color: "hsl(var(--chart-2))",
  },
  total: {
    label: "Total Tasks",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig

interface ChartAreaInteractiveProps {
  data?: unknown[]
}

export function ChartAreaInteractive({ data }: ChartAreaInteractiveProps) {
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState("90d")

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  const filteredData = chartData.filter((item) => {
    const date = new Date(item.date)
    const referenceDate = new Date("2024-06-30")
    let daysToSubtract = 90
    if (timeRange === "30d") {
      daysToSubtract = 30
    } else if (timeRange === "7d") {
      daysToSubtract = 7
    }
    const startDate = new Date(referenceDate)
    startDate.setDate(startDate.getDate() - daysToSubtract)
    return date >= startDate
  })

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Task completion trends over the last 3 months
          </span>
          <span className="@[540px]/card:hidden">Last 3 months</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setTimeRange}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:!px-4 @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 3 months" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-[250px] w-full"
        >
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillCompleted" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-completed)"
                  stopOpacity={1.0}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-completed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillInProgress" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-inProgress)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-inProgress)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value)
                return date.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }}
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }}
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="inProgress"
              type="natural"
              fill="url(#fillInProgress)"
              stroke="var(--color-inProgress)"
              stackId="a"
            />
            <Area
              dataKey="completed"
              type="natural"
              fill="url(#fillCompleted)"
              stroke="var(--color-completed)"
              stackId="a"
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
