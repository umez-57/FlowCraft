"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { Label } from "@/components/ui/label"

interface KeyValueEditorProps {
  label?: string
  value: Record<string, string>
  onChange: (value: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
}

export function KeyValueEditor({
  label,
  value,
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
}: KeyValueEditorProps) {
  const [newKey, setNewKey] = useState("")
  const [newVal, setNewVal] = useState("")

  const entries = Object.entries(value ?? {})

  const updateEntry = (oldKey: string, newKeyValue: string, newValue: string) => {
    const next: Record<string, string> = {}
    for (const [k, v] of Object.entries(value ?? {})) {
      if (k === oldKey) {
        if (newKeyValue) next[newKeyValue] = newValue
      } else {
        next[k] = v
      }
    }
    onChange(next)
  }

  const removeEntry = (key: string) => {
    const next = { ...(value ?? {}) }
    delete next[key]
    onChange(next)
  }

  const addEntry = () => {
    if (!newKey.trim()) return
    onChange({ ...(value ?? {}), [newKey]: newVal })
    setNewKey("")
    setNewVal("")
  }

  return (
    <div className="space-y-2">
      {label && <Label className="text-xs font-medium">{label}</Label>}
      <div className="space-y-2">
        {entries.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2">
            <Input
              className="h-8 flex-1 text-xs"
              value={k}
              onChange={(e) => updateEntry(k, e.target.value, v)}
              placeholder={keyPlaceholder}
            />
            <Input
              className="h-8 flex-1 text-xs"
              value={v}
              onChange={(e) => updateEntry(k, k, e.target.value)}
              placeholder={valuePlaceholder}
            />
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-8 w-8 shrink-0"
              onClick={() => removeEntry(k)}
              aria-label={`Remove ${k}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Input
          className="h-8 flex-1 text-xs"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          placeholder={keyPlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addEntry()
            }
          }}
        />
        <Input
          className="h-8 flex-1 text-xs"
          value={newVal}
          onChange={(e) => setNewVal(e.target.value)}
          placeholder={valuePlaceholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addEntry()
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-8 w-8 shrink-0"
          onClick={addEntry}
          aria-label="Add entry"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
