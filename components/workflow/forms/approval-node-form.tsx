"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { ApprovalNodeData } from "@/types/workflow"

interface ApprovalNodeFormProps {
  data: ApprovalNodeData
  onChange: (patch: Partial<ApprovalNodeData>) => void
  errors: Record<string, string>
}

const APPROVER_ROLES = ["Manager", "HRBP", "Director", "VP", "CFO", "CEO"]

export function ApprovalNodeForm({ data, onChange, errors }: ApprovalNodeFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="appr-title" className="text-xs font-medium">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="appr-title"
          value={data.title}
          onChange={(e) => onChange({ title: e.target.value, label: e.target.value })}
          placeholder="e.g., Manager Approval"
          aria-invalid={!!errors.title}
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs font-medium">
          Approver Role <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.approverRole}
          onValueChange={(v) => onChange({ approverRole: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a role" />
          </SelectTrigger>
          <SelectContent>
            {APPROVER_ROLES.map((r) => (
              <SelectItem key={r} value={r}>
                {r}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="appr-threshold" className="text-xs font-medium">
          Auto-approve threshold
        </Label>
        <Input
          id="appr-threshold"
          type="number"
          min={0}
          value={data.autoApproveThreshold ?? 0}
          onChange={(e) =>
            onChange({
              autoApproveThreshold: Number.isFinite(e.target.valueAsNumber)
                ? e.target.valueAsNumber
                : 0,
            })
          }
          placeholder="0"
        />
        <p className="text-[11px] text-muted-foreground">
          Requests at or below this amount will be auto-approved.
        </p>
      </div>
    </div>
  )
}
