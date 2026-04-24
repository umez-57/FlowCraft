"use client"

import { useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { AutomatedStepNodeData } from "@/types/workflow"
import { useAutomations } from "@/hooks/use-automations"
import { Loader2 } from "lucide-react"

interface AutomatedStepNodeFormProps {
  data: AutomatedStepNodeData
  onChange: (patch: Partial<AutomatedStepNodeData>) => void
  errors: Record<string, string>
}

export function AutomatedStepNodeForm({
  data,
  onChange,
  errors,
}: AutomatedStepNodeFormProps) {
  const { actions, loading } = useAutomations()

  const selectedAction = useMemo(
    () => actions.find((a) => a.id === data.actionId),
    [actions, data.actionId],
  )

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="auto-title" className="text-xs font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="auto-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value, label: e.target.value })}
          placeholder="e.g., Send welcome email"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          Action <span className="text-destructive">*</span>
        </Label>
        {loading ? (
          <div className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading actions...
          </div>
        ) : (
          <Select
            value={data.actionId}
            onValueChange={(v) =>
              onChange({ actionId: v, actionParams: {} })
            }
          >
            <SelectTrigger aria-invalid={!!errors.actionId}>
              <SelectValue placeholder="Select an action" />
            </SelectTrigger>
            <SelectContent>
              {actions.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {errors.actionId && (
          <p className="text-xs text-destructive">{errors.actionId}</p>
        )}
      </div>
      {selectedAction && selectedAction.params.length > 0 && (
        <div className="space-y-2 rounded-md border bg-muted/30 p-3">
          <Label className="text-xs font-medium">Parameters</Label>
          <div className="space-y-2">
            {selectedAction.params.map((param) => (
              <div key={param} className="space-y-1">
                <Label htmlFor={`param-${param}`} className="text-[11px] capitalize text-muted-foreground">
                  {param}
                </Label>
                <Input
                  id={`param-${param}`}
                  value={data.actionParams?.[param] ?? ""}
                  onChange={(e) =>
                    onChange({
                      actionParams: {
                        ...(data.actionParams ?? {}),
                        [param]: e.target.value,
                      },
                    })
                  }
                  placeholder={`Enter ${param}`}
                  className="h-8"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
