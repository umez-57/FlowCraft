"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StartNodeData } from "@/types/workflow"
import { KeyValueEditor } from "./key-value-editor"

interface StartNodeFormProps {
  data: StartNodeData
  onChange: (patch: Partial<StartNodeData>) => void
}

export function StartNodeForm({ data, onChange }: StartNodeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="start-title" className="text-xs font-medium">
          Start Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="start-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value, label: e.target.value })}
          placeholder="e.g., Onboarding Process"
        />
      </div>
      <KeyValueEditor
        label="Metadata"
        value={data.metadata ?? {}}
        onChange={(metadata) => onChange({ metadata })}
        keyPlaceholder="e.g., department"
        valuePlaceholder="e.g., Engineering"
      />
    </div>
  )
}
