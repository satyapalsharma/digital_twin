"use client";

import { GripVertical, Trash2, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type QuestionType = "likert" | "multi_choice" | "open_text" | "yes_no";

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options?: string[];
  scale_min?: number;
  scale_max?: number;
}

interface Props {
  question: Question;
  index: number;
  onChange: (q: Question) => void;
  onDelete: () => void;
}

const TYPE_LABELS: Record<QuestionType, string> = {
  likert: "Likert scale (1-N)",
  multi_choice: "Multiple choice",
  open_text: "Open text",
  yes_no: "Yes / No / Maybe",
};

export function QuestionEditor({ question, index, onChange, onDelete }: Props) {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GripVertical className="size-4 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground tabular-nums">
            Q{index + 1}
          </span>
          <div className="flex-1" />
          <Select
            value={question.type}
            onValueChange={(t) =>
              onChange({
                ...question,
                type: t as QuestionType,
                // reset type-specific fields
                options: t === "multi_choice" ? (question.options ?? ["", ""]) : undefined,
                scale_min: t === "likert" ? (question.scale_min ?? 1) : undefined,
                scale_max: t === "likert" ? (question.scale_max ?? 5) : undefined,
              })
            }
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(TYPE_LABELS) as QuestionType[]).map((t) => (
                <SelectItem key={t} value={t}>
                  {TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <Input
          placeholder="Question prompt..."
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
        />

        {question.type === "likert" && (
          <div className="flex gap-2 items-center text-sm">
            <span className="text-muted-foreground">Scale:</span>
            <Input
              type="number"
              value={question.scale_min ?? 1}
              onChange={(e) => onChange({ ...question, scale_min: Number(e.target.value) })}
              className="w-20"
              min={1}
              max={10}
            />
            <span>to</span>
            <Input
              type="number"
              value={question.scale_max ?? 5}
              onChange={(e) => onChange({ ...question, scale_max: Number(e.target.value) })}
              className="w-20"
              min={2}
              max={10}
            />
          </div>
        )}

        {question.type === "multi_choice" && (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Options</div>
            {(question.options ?? []).map((opt, i) => (
              <div key={i} className="flex gap-2">
                <Input
                  placeholder={`Option ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...(question.options ?? [])];
                    next[i] = e.target.value;
                    onChange({ ...question, options: next });
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const next = [...(question.options ?? [])];
                    next.splice(i, 1);
                    onChange({ ...question, options: next });
                  }}
                  className="text-muted-foreground hover:text-destructive"
                  disabled={(question.options?.length ?? 0) <= 2}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                onChange({
                  ...question,
                  options: [...(question.options ?? []), ""],
                })
              }
            >
              <Plus className="size-3.5" />
              Add option
            </Button>
          </div>
        )}

        {question.type === "yes_no" && (
          <p className="text-xs text-muted-foreground italic">
            Agents will choose from: yes / no / maybe
          </p>
        )}

        {question.type === "open_text" && (
          <p className="text-xs text-muted-foreground italic">
            Agents will respond with free text (1-3 sentences)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
