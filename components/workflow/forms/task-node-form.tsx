"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { TaskNodeData } from "@/types/workflow"
import { KeyValueEditor } from "./key-value-editor"

interface TaskNodeFormProps {
  data: TaskNodeData
  onChange: (patch: Partial<TaskNodeData>) => void
  errors: Record<string, string>
}

export function TaskNodeForm({ data, onChange, errors }: TaskNodeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="task-title" className="text-xs font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="task-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value, label: e.target.value })}
          placeholder="e.g., Collect ID documents"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="task-desc" className="text-xs font-medium">
          Description
        </Label>
        <Textarea
          id="task-desc"
          value={data.description ?? ""}
          onChange={(e) => onChange({ description: e.target.value })}
          placeholder="Describe what needs to be done..."
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="task-assignee" className="text-xs font-medium">
            Assignee
          </Label>
          <Input
            id="task-assignee"
            value={data.assignee ?? ""}
            onChange={(e) => onChange({ assignee: e.target.value })}
            placeholder="jane@company.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="task-due" className="text-xs font-medium">
            Due Date
          </Label>
          <Input
            id="task-due"
            type="date"
            value={data.dueDate ?? ""}
            onChange={(e) => onChange({ dueDate: e.target.value })}
          />
        </div>
      </div>
      <KeyValueEditor
        label="Custom Fields"
        value={data.customFields ?? {}}
        onChange={(customFields) => onChange({ customFields })}
      />
    </div>
  )
}
