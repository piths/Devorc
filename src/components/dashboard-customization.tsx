"use client"

import * as React from "react"
import {
  IconSettings,
  IconLayoutGrid,
  IconEye,
  IconEyeOff,
  IconArrowsSort,
  IconRefresh,
} from "@tabler/icons-react"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface DashboardWidget {
  id: string
  name: string
  description: string
  enabled: boolean
  order: number
  category: 'metrics' | 'charts' | 'activity' | 'integration'
}

interface DashboardCustomizationProps {
  onLayoutChange?: (layout: string) => void
  onWidgetToggle?: (widgetId: string, enabled: boolean) => void
  onWidgetReorder?: (widgets: DashboardWidget[]) => void
}

export function DashboardCustomization({ 
  onLayoutChange, 
  onWidgetToggle, 
  onWidgetReorder 
}: DashboardCustomizationProps) {
  const [widgets, setWidgets] = React.useState<DashboardWidget[]>([
    {
      id: 'metrics',
      name: 'Project Metrics',
      description: 'Key performance indicators and progress metrics',
      enabled: true,
      order: 1,
      category: 'metrics'
    },
    {
      id: 'github-status',
      name: 'GitHub Integration',
      description: 'GitHub connection status and repository information',
      enabled: true,
      order: 2,
      category: 'integration'
    },
    {
      id: 'quick-actions',
      name: 'Quick Actions',
      description: 'Shortcut buttons for common tasks',
      enabled: true,
      order: 3,
      category: 'metrics'
    },
    {
      id: 'project-progress',
      name: 'Project Progress',
      description: 'Detailed progress tracking and timeline',
      enabled: true,
      order: 4,
      category: 'charts'
    },
    {
      id: 'activity-feed',
      name: 'Activity Feed',
      description: 'Recent team activities and updates',
      enabled: true,
      order: 5,
      category: 'activity'
    },
    {
      id: 'progress-chart',
      name: 'Progress Chart',
      description: 'Visual representation of project progress over time',
      enabled: true,
      order: 6,
      category: 'charts'
    },
    {
      id: 'data-table',
      name: 'Data Table',
      description: 'Detailed task and project data in table format',
      enabled: true,
      order: 7,
      category: 'metrics'
    }
  ])

  const [layout, setLayout] = React.useState('default')
  const [isOpen, setIsOpen] = React.useState(false)

  const handleWidgetToggle = (widgetId: string, enabled: boolean) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId ? { ...widget, enabled } : widget
    )
    setWidgets(updatedWidgets)
    onWidgetToggle?.(widgetId, enabled)
  }

  const handleLayoutChange = (newLayout: string) => {
    setLayout(newLayout)
    onLayoutChange?.(newLayout)
  }

  const handleReset = () => {
    const defaultWidgets = widgets.map(widget => ({ ...widget, enabled: true }))
    setWidgets(defaultWidgets)
    setLayout('default')
    onWidgetReorder?.(defaultWidgets)
  }

  const enabledWidgets = widgets.filter(w => w.enabled).length
  const totalWidgets = widgets.length

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <IconSettings className="h-4 w-4 mr-2" />
          Customize
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconLayoutGrid className="h-5 w-5" />
            Dashboard Customization
          </DialogTitle>
          <DialogDescription>
            Customize your dashboard layout and choose which widgets to display
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Layout Selection */}
          <div className="space-y-3">
            <Label htmlFor="layout-select">Layout</Label>
            <Select value={layout} onValueChange={handleLayoutChange}>
              <SelectTrigger id="layout-select">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Layout</SelectItem>
                <SelectItem value="compact">Compact Layout</SelectItem>
                <SelectItem value="expanded">Expanded Layout</SelectItem>
                <SelectItem value="focused">Focused Layout</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Widget Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Widgets ({enabledWidgets}/{totalWidgets} enabled)</Label>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <IconRefresh className="h-4 w-4 mr-2" />
                Reset to Default
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {widgets
                .sort((a, b) => a.order - b.order)
                .map((widget) => (
                  <Card key={widget.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-medium truncate">
                            {widget.name}
                          </h4>
                          <Badge variant="outline" className="text-xs">
                            {widget.category}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {widget.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Switch
                          checked={widget.enabled}
                          onCheckedChange={(enabled) => handleWidgetToggle(widget.id, enabled)}
                        />
                        {widget.enabled ? (
                          <IconEye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <IconEyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-3">
            <Label>Quick Actions</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm">
                <IconArrowsSort className="h-4 w-4 mr-2" />
                Reorder Widgets
              </Button>
              <Button variant="outline" size="sm">
                <IconLayoutGrid className="h-4 w-4 mr-2" />
                Save Layout
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setIsOpen(false)}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
