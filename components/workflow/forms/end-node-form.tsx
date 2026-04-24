"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import type { EndNodeData } from "@/types/workflow"

interface EndNodeFormProps {
  data: EndNodeData
  onChange: (patch: Partial<EndNodeData>) => void
}

export function EndNodeForm({ data, onChange }: EndNodeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="end-msg" className="text-xs font-medium">
          End Message
        </Label>
        <Input
          id="end-msg"
          value={data.endMessage}
          onChange={(e) => onChange({ endMessage: e.target.value, label: e.target.value })}
          placeholder="e.g., Onboarding complete"
        />
      </div>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label htmlFor="end-summary" className="text-xs font-medium">
            Include summary
          </Label>
          <p className="text-[11px] text-muted-foreground">
            Generate a summary of the workflow run.
          </p>
        </div>
        <Switch
          id="end-summary"
          checked={!!data.summary}
          onCheckedChange={(checked) => onChange({ summary: checked })}
        />
      </div>
    </div>
  )
}
